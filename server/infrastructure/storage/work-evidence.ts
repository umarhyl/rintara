import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "work-completion-evidence";
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 25_000_000;
const ACCEPTED_INPUT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

let bucketReady: Promise<void> | null = null;

function storageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensurePrivateBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const client = storageAdmin();
      const { data, error } = await client.storage.getBucket(BUCKET);

      if (data && !error) {
        if (data.public) {
          throw new Error("Work evidence bucket must remain private.");
        }
        const { error: updateError } = await client.storage.updateBucket(
          BUCKET,
          {
            public: false,
            fileSizeLimit: MAX_INPUT_BYTES,
            allowedMimeTypes: ["image/webp"],
          },
        );
        if (updateError) throw updateError;
        return;
      }

      const { error: createError } = await client.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_INPUT_BYTES,
        allowedMimeTypes: ["image/webp"],
      });

      if (
        createError &&
        !createError.message.toLowerCase().includes("already exists")
      ) {
        throw createError;
      }
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }

  await bucketReady;
}

export type PreparedWorkEvidence = {
  bytes: Buffer;
  mimeType: "image/webp";
  byteSize: number;
  sha256: string;
};

export async function prepareWorkEvidence(
  file: File,
): Promise<PreparedWorkEvidence> {
  if (!ACCEPTED_INPUT_TYPES.has(file.type) || file.size <= 0) {
    throw new Error("UNSUPPORTED_WORK_EVIDENCE");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("WORK_EVIDENCE_TOO_LARGE");
  }

  const input = Buffer.from(await file.arrayBuffer());
  let bytes: Buffer;

  try {
    bytes = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("INVALID_WORK_EVIDENCE");
  }

  if (bytes.length <= 0 || bytes.length > MAX_INPUT_BYTES) {
    throw new Error("WORK_EVIDENCE_TOO_LARGE");
  }

  return {
    bytes,
    mimeType: "image/webp",
    byteSize: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function uploadWorkEvidenceObject(
  agreementId: string,
  evidence: PreparedWorkEvidence,
): Promise<string> {
  await ensurePrivateBucket();
  const path = `${agreementId}/${randomUUID()}.webp`;
  const { error } = await storageAdmin()
    .storage.from(BUCKET)
    .upload(path, evidence.bytes, {
      contentType: evidence.mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function deleteWorkEvidenceObject(path: string): Promise<void> {
  await ensurePrivateBucket();
  const { error } = await storageAdmin().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function downloadWorkEvidenceObject(
  path: string,
): Promise<ArrayBuffer> {
  await ensurePrivateBucket();
  const { data, error } = await storageAdmin().storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error("Work evidence not found.");
  return data.arrayBuffer();
}
