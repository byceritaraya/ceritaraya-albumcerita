/**
 * media.ts — Central Media Abstraction
 *
 * This is the ONLY file that knows about Cloudeka S3 / object storage.
 * All upload, retrieval, and deletion of binary media in the application
 * must go through this module.
 *
 * Rules:
 *  - NEVER import this in client components (it uses server-only AWS SDK)
 *  - NEVER expose S3Client, credentials, or raw Cloudeka URLs to the browser
 *  - The rest of the app should only call uploadMedia / getMediaUrl / deleteMedia
 *  - Credentials come exclusively from server-side env vars (never NEXT_PUBLIC_*)
 *
 * Cloudeka is S3-compatible (StorageGRID). We use @aws-sdk/client-s3.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Config ──────────────────────────────────────────────────────────────────

const ENDPOINT = process.env.CLOUDEKA_S3_ENDPOINT!;
const REGION   = process.env.CLOUDEKA_S3_REGION ?? 'us-east-1';
const BUCKET   = process.env.CLOUDEKA_S3_BUCKET!;
const PUBLIC_BASE_URL = process.env.CLOUDEKA_PUBLIC_BASE_URL; // optional

// ─── S3 Client (server-only singleton) ───────────────────────────────────────

function createS3Client(): S3Client {
  if (!ENDPOINT || !BUCKET) {
    throw new Error(
      'Cloudeka S3 is not configured. Set CLOUDEKA_S3_ENDPOINT, CLOUDEKA_S3_BUCKET, ' +
      'CLOUDEKA_ACCESS_KEY_ID, and CLOUDEKA_SECRET_ACCESS_KEY in your environment.'
    );
  }
  return new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
      accessKeyId: process.env.CLOUDEKA_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDEKA_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // required for StorageGRID / Cloudeka
    // Prevent AWS SDK v3 from adding unsupported checksum headers (e.g., x-amz-checksum-mode)
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

// Lazy singleton — only created when first needed (server-side only)
let _s3: S3Client | null = null;
function getS3Client(): S3Client {
  if (!_s3) _s3 = createS3Client();
  return _s3;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadMediaOptions {
  /** S3 object key, e.g. "events/{eventId}/photos/{uuid}.jpg" */
  objectKey: string;
  /** File content as Buffer */
  body: Buffer;
  /** MIME type, e.g. "image/jpeg" */
  contentType: string;
}

export interface UploadMediaResult {
  /** The object key that was uploaded (pass this to getMediaUrl) */
  objectKey: string;
  error?: never;
}

export interface UploadMediaError {
  objectKey?: never;
  error: string;
}

/**
 * Uploads a binary object to Cloudeka S3.
 * Returns the objectKey on success or an error message on failure.
 */
export async function uploadMedia(
  options: UploadMediaOptions
): Promise<UploadMediaResult | UploadMediaError> {
  try {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: options.objectKey,
        Body: options.body,
        ContentType: options.contentType,
      })
    );
    return { objectKey: options.objectKey };
  } catch (err) {
    console.error('[media] uploadMedia failed:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Object Key Resolution (Legacy Fallback) ──────────────────────────────────

/**
 * In-memory cache for resolved object keys.
 * Keys are UUIDs, so they are unique and immutable.
 * Caching this avoids redundant HeadObject requests for the lifetime of the process.
 */
const resolvedKeyCache = new Map<string, string>();

/**
 * Resolves the actual object key in Cloudeka.
 * Handles the fallback for legacy photos that were uploaded via Supabase Storage
 * and thus have the 'albumcerita_photos/' prefix in the underlying bucket.
 */
async function resolveMediaKey(objectKey: string): Promise<string> {
  if (!objectKey) return '';
  if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) return objectKey;

  if (resolvedKeyCache.has(objectKey)) {
    return resolvedKeyCache.get(objectKey)!;
  }

  try {
    // 1. Try root key (new uploads)
    const existsAtRoot = await mediaExists(objectKey);
    if (existsAtRoot) {
      resolvedKeyCache.set(objectKey, objectKey);
      return objectKey;
    }

    // 2. Fallback to legacy Supabase Storage prefix
    const legacyKey = `albumcerita_photos/${objectKey}`;
    const existsAtLegacy = await mediaExists(legacyKey);
    if (existsAtLegacy) {
      resolvedKeyCache.set(objectKey, legacyKey);
      return legacyKey;
    }
  } catch (err) {
    console.error('[media] resolveMediaKey existence check failed:', err);
    // On network/auth errors, do not cache anything, but safely fallback
    return objectKey;
  }

  // 3. If neither found (deleted or missing), default to root key 
  // so the presigned URL generation doesn't crash (will just return a 404 URL).
  return objectKey;
}

// ─── URL Generation ───────────────────────────────────────────────────────────

/**
 * Resolves a media object key to a URL safe to send to the browser.
 *
 * If CLOUDEKA_PUBLIC_BASE_URL is set, returns a direct public URL.
 * Otherwise, returns a server-generated presigned URL valid for 1 hour.
 *
 * Rules:
 *  - NEVER returns credentials
 *  - Safe to embed in HTML / pass to <img src>
 *
 * @param objectKey  The relative object key stored in the database
 *                   (e.g. "events/{id}/photos/{uuid}.jpg" or legacy "{uuid}/{uuid}.jpg")
 */
export async function getMediaUrl(objectKey: string): Promise<string> {
  if (!objectKey) return '';

  const actualKey = await resolveMediaKey(objectKey);

  // If the objectKey is already an absolute URL (legacy compatibility),
  // return it as-is. This handles old records where original_url was stored
  // as a full Supabase Storage URL. Callers should prefer storage_path,
  // but this guard prevents breakage for legacy data.
  if (actualKey.startsWith('http://') || actualKey.startsWith('https://')) {
    // For legacy Supabase Storage URLs we cannot directly serve them (0-byte bug).
    // This case should only occur if storage_path is missing; callers should always
    // prefer the objectKey from storage_path / cover_image_url (relative path).
    return actualKey;
  }

  // Public bucket: return direct Cloudeka URL
  if (PUBLIC_BASE_URL) {
    return `${PUBLIC_BASE_URL.replace(/\/$/, '')}/${actualKey}`;
  }

  // Private bucket: generate presigned GET URL (server-side, expires in 1 hour)
  try {
    const s3 = getS3Client();
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: actualKey }),
      { expiresIn: 3600 }
    );
    return url;
  } catch (err) {
    console.error('[media] getMediaUrl presign failed:', err);
    return '';
  }
}

/**
 * Generates presigned GET URLs for multiple object keys in parallel.
 * Returns a Map from objectKey → URL.
 */
export async function getMediaUrls(
  objectKeys: string[]
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    objectKeys.map(async (key) => [key, await getMediaUrl(key)] as const)
  );
  return new Map(entries);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes an object from Cloudeka S3.
 * Call this BEFORE removing the database metadata record.
 */
export async function deleteMedia(objectKey: string): Promise<{ error?: string }> {
  if (!objectKey || objectKey.startsWith('http')) {
    // Cannot delete by full URL; skip silently
    return {};
  }
  try {
    const actualKey = await resolveMediaKey(objectKey);
    const s3 = getS3Client();
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: actualKey }));
    resolvedKeyCache.delete(objectKey);
    return {};
  } catch (err) {
    console.error('[media] deleteMedia failed:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Existence Check (optional utility) ──────────────────────────────────────

/**
 * Returns true if the object exists in Cloudeka.
 * Useful for debugging / migration validation.
 */
export async function mediaExists(objectKey: string): Promise<boolean> {
  try {
    const s3 = getS3Client();
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    return true;
  } catch (err) {
    // 404 means the object doesn't exist
    const error = err as Error & { $metadata?: { httpStatusCode?: number } };
    if (error.name === 'NotFound' || error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // Auth errors, network errors, configuration errors, etc.
    // MUST NOT be swallowed as a false "does not exist".
    throw err;
  }
}
