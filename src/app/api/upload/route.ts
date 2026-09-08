// =============================================================================
// ConMart — Product Image Upload
// =============================================================================
// Accepts multipart FormData from a verified supplier, confirms the bytes are
// actually an image, stores the object in Supabase Storage, and returns its
// public URL.
//
// In development it falls back to public/uploads/products so the app works
// before a bucket exists. In production it fails with 503 instead: a
// serverless filesystem is ephemeral and per-instance, so a local write would
// produce an image link that breaks on the next deploy.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorize } from "@/lib/auth/session";
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
 * Identifies the image format from its leading bytes.
 *
 * The declared Content-Type and file extension are attacker-controlled, so an
 * HTML or SVG payload can arrive labelled `image/jpeg`. Serving that back from
 * the storage origin would be stored XSS, so the format is taken from the
 * bytes and everything unrecognized is refused. SVG is excluded deliberately:
 * it is a script-bearing document, not a bitmap.
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

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, extension: ".gif", contentType: "image/gif" };
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
    // 1. Authenticate and authorize from the database, not the JWT
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    // 2. Cap upload volume. Without this, one authenticated supplier can fill
    //    the storage bucket and run up the egress bill.
    const clientId = await getClientIdentifier();
    const [byUser, byIp] = await Promise.all([
      rateLimit(`upload:user:${auth.user.id}`, { limit: 40, windowSeconds: 3600 }),
      rateLimit(`upload:ip:${clientId}`, { limit: 60, windowSeconds: 3600 }),
    ]);

    if (!byUser.allowed || !byIp.allowed) {
      const retryAfter = Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds);
      return NextResponse.json(
        { error: rateLimitMessage(retryAfter) },
        { status: 429, headers: { "retry-after": String(retryAfter) } }
      );
    }

    // 3. Extract and check file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // 4. Read bytes and validate real magic numbers
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { valid, extension, contentType } = validateImageMagicBytes(buffer);

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Invalid or unverified image file. Please upload a genuine JPEG, PNG, WebP, or GIF image.",
        },
        { status: 400 }
      );
    }

    // 5. Name the object ourselves. The client-supplied filename is discarded
    //    entirely, so it cannot contain path separators or a second extension.
    //    The content type is derived from the verified magic bytes rather than
    //    the client's Content-Type header.
    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const filename = `mat-${Date.now()}-${randomSuffix}${extension}`;

    let publicUrl: string | null = null;

    // 6. Upload with the service-role client after authorize() has already
    //    confirmed this caller is a seller or admin. The user session cannot
    //    write to Storage unless extra bucket policies exist; the admin key
    //    bypasses those and is the production path.
    try {
      const supabase = createSupabaseAdminClient();
      const bucket = env.SUPABASE_STORAGE_BUCKET;

      if (!supabase) {
        console.error("Supabase storage upload failed: SUPABASE_SERVICE_ROLE_KEY is not set");
      } else {
        const { error: bucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
        });

        if (
          bucketError &&
          !/already exists|duplicate/i.test(bucketError.message)
        ) {
          console.error("Supabase storage bucket ensure failed:", bucketError.message);
        }

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filename, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase storage upload failed:", uploadError.message);
        } else {
          publicUrl =
            supabase.storage.from(bucket).getPublicUrl(filename).data?.publicUrl ?? null;
        }
      }
    } catch (storageError) {
      console.error("Supabase storage threw:", storageError);
    }

    // 7. Local disk fallback, development only.
    //
    //    Serverless filesystems are ephemeral and per-instance: a file written
    //    here would vanish on the next deploy and be invisible to every other
    //    instance in the meantime. Failing loudly in production surfaces a
    //    misconfigured bucket instead of silently producing dead image links.
    if (!publicUrl && env.NODE_ENV === "development") {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
        publicUrl = `/uploads/products/${filename}`;
      } catch (fsError) {
        console.error("Local upload fallback failed:", fsError);
      }
    }

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Image storage is unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to process and upload image." },
      { status: 500 }
    );
  }
}
