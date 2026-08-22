import { supabase } from "@/lib/supabase";

const BUCKET = "course-assets";

/**
 * A resource's `storage_path` is normally an object key inside the bucket, but it
 * may also be a plain external URL - a Google Doc that has to stay editable, an
 * image hosted elsewhere. Anything that starts with http(s) is treated as a link
 * and passed through untouched instead of being resolved against the bucket.
 */
export function isExternalUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

/** Get an on-demand signed URL for a private storage object. */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string> {
  if (isExternalUrl(storagePath)) return storagePath;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** Download a file as a blob (for cross-origin download buttons). */
export async function downloadFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);
  if (error) throw error;
  return data;
}

/** Trigger a browser download from a storage path. */
export async function triggerDownload(
  storagePath: string,
  filename: string
): Promise<void> {
  // An external link cannot be fetched as a blob cross-origin - open it instead.
  if (isExternalUrl(storagePath)) {
    window.open(storagePath, "_blank", "noopener,noreferrer");
    return;
  }
  const blob = await downloadFile(storagePath);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Upload a file to the course-assets bucket (admin only). */
export async function uploadFile(
  storagePath: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true });
  if (error) throw error;
  return storagePath;
}

/** Delete a file from the course-assets bucket (admin only). */
export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);
  if (error) throw error;
}
