// =============================================================================
// ConMart — Agent Onboarding Document Upload API
// =============================================================================
// Accepts Grade 12 completion certificates, National ID documents, and
// Guarantor backing letters for 01B Agent Application vetting.
//
// Security & Compliance:
// 1. Magic byte verification (PDF: %PDF, JPEG: FF D8 FF, PNG: 89 50 4E 47).
// 2. Strict 5 MB file size limit.
// 3. Authenticated session validation.
// 4. Rate-limited to prevent storage abuse.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB as specified in 01B

interface DocTypeCheck {
  valid: boolean;
  extension: string;
  contentType: string;
}

const REJECTED: DocTypeCheck = { valid: false, extension: "", contentType: "" };

/**
 * Validates document magic bytes (PDF, JPEG, PNG).
 */
function validateDocMagicBytes(buffer: Buffer): DocTypeCheck {
  if (buffer.length < 8) {
    return REJECTED;
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, extension: ".pdf", contentType: "application/pdf" };
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

  return REJECTED;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to upload application documents." },
        { status: 401 }
      );
    }

    const clientId = await getClientIdentifier();
    const [byUser, byIp] = await Promise.all([
      rateLimit(`agent-doc:user:${user.id}`, { limit: 15, windowSeconds: 3600 }),
      rateLimit(`agent-doc:ip:${clientId}`, { limit: 30, windowSeconds: 3600 }),
    ]);

    if (!byUser.allowed || !byIp.allowed) {
      const retryAfter = Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds);
      return NextResponse.json(
        { error: rateLimitMessage(retryAfter) },
        { status: 429, headers: { "retry-after": String(retryAfter) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string | null) || "document";

    if (!file) {
      return NextResponse.json({ error: "No document file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB limit. Please upload a file smaller than 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { valid, extension, contentType } = validateDocMagicBytes(buffer);

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Please upload a genuine PDF, JPG, or PNG document.",
        },
        { status: 400 }
      );
    }

    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const sanitizedDocType = docType.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `agent-${sanitizedDocType}-${Date.now()}-${randomSuffix}${extension}`;

    let documentUrl: string | null = null;
    const storagePath = `agent-docs/${filename}`;

    // Cloud object storage (Supabase Storage with private bucket access)
    try {
      const supabase = createSupabaseAdminClient();
      const bucket = env.SUPABASE_STORAGE_BUCKET;

      if (supabase) {
        // Enforce private bucket to prevent unauthenticated public scraping of PII
        await supabase.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: MAX_FILE_SIZE,
        });

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType,
            upsert: false,
          });

        if (!uploadError) {
          // Generate short-lived presigned URL (1 hour / 3600s) for viewing
          const { data: signedData, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(storagePath, 3600);

          if (!signError && signedData?.signedUrl) {
            documentUrl = signedData.signedUrl;
          }
        } else {
          console.error("Supabase private document upload error:", uploadError.message);
        }
      }
    } catch (storageErr) {
      console.error("Supabase storage agent doc upload error:", storageErr);
    }

    // PII Security: Cloud object storage is strictly MANDATORY for sensitive identity documents
    // (national IDs, certificates, guarantor letters).
    // Under NO circumstances should PII ever be written to local disk (neither public/ nor private).
    // If cloud storage is unavailable, fail hard with 503 Service Unavailable and leave zero files on disk.
    if (!documentUrl) {
      return NextResponse.json(
        { error: "Secure document storage is temporarily unavailable. Please retry." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      url: documentUrl,
      storagePath,
      filename,
    });
  } catch (error) {
    console.error("Agent document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document. Please try again." },
      { status: 500 }
    );
  }
}
