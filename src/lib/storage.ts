import { supabase } from "@/lib/supabase";

const BUCKET = "course-assets";

/** Get an on-demand signed URL for a private storage object. */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string> {
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
