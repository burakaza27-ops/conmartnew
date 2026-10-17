// =============================================================================
// ECON — Guest Site Wastage Live Photo Upload Route
// =============================================================================
// Publicly accessible upload endpoint specifically for site foremen, engineers,
// and contractors uploading photos of leftover site materials (rebar, timber, blocks).
//
// Key Protections:
// 1. IP-based Rate Limiting (30 uploads / hour / IP) to prevent spam/abuse
// 2. Strict Magic Byte Verification (JPEG, PNG, WebP) to block non-image binaries
// 3. 5MB File Size Cap
// 4. Cloudflare / Supabase Storage with local dev fallback
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/config/env";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImageTypeCheck {
  valid: boolean;
  extension: string;
  contentType: string;
}

const REJECTED: ImageTypeCheck = { valid: false, extension: "", contentType: "" };

/**
 * Validates leading magic bytes to ensure file is genuinely a bitmap image.
 * Excludes SVG (potential XSS vector) and non-images.
 */
function validateImageMagicBytes(buffer: Buffer): ImageTypeCheck {
  if (buffer.length < 12) {
    return REJECTED;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, extension: ".jpg", contentType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, extension: ".png", contentType: "image/png" };
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, extension: ".webp", contentType: "image/webp" };
  }

  return REJECTED;
}

export async function POST(request: NextRequest) {
  try {
    // 1. IP rate limiting (No auth required for guest construction site posts)
    const clientId = await getClientIdentifier();
    const ipCheck = await rateLimit(`upload:wastage:ip:${clientId}`, {
      limit: 30,
      windowSeconds: 3600,
    });

    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitMessage(ipCheck.retryAfterSeconds) },
        {
          status: 429,
          headers: { "retry-after": String(ipCheck.retryAfterSeconds) },
        }
      );
    }

    // 2. Extract and inspect uploaded file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No photo provided. Please snap or upload an image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Photo exceeds the 5MB limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    // 3. Inspect magic bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { valid, extension, contentType } = validateImageMagicBytes(buffer);

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Invalid or unsupported image format. Please capture a real camera JPEG, PNG, or WebP photo.",
        },
        { status: 400 }
      );
    }

    // 4. Secure random filename
    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const filename = `wst-${Date.now()}-${randomSuffix}${extension}`;

    let publicUrl: string | null = null;

    // 5. Cloud Supabase Storage upload
    try {
      const supabase = createSupabaseAdminClient();
      const bucket = env.SUPABASE_STORAGE_BUCKET;

      if (supabase) {
        const { error: bucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
        });

        if (
          bucketError &&
          !/already exists|duplicate/i.test(bucketError.message)
        ) {
          console.error("Supabase wastage bucket ensure failed:", bucketError.message);
        }

        const storagePath = `site-wastages/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase wastage photo upload failed:", uploadError.message);
        } else {
          publicUrl =
            supabase.storage.from(bucket).getPublicUrl(storagePath).data?.publicUrl ?? null;
        }
      }
    } catch (storageError) {
      console.error("Supabase storage threw during wastage upload:", storageError);
    }

    // 6. Local disk fallback for development environments
    if (!publicUrl && env.NODE_ENV === "development") {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "wastage");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
        publicUrl = `/uploads/wastage/${filename}`;
      } catch (fsError) {
        console.error("Local wastage upload fallback failed:", fsError);
      }
    }

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Image storage service is currently unavailable. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error("Site wastage photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload site photo. Please try again." },
      { status: 500 }
    );
  }
}
