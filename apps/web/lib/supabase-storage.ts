import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createStorageClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and key must be configured for storage uploads");
  }

  return createClient(url, key);
}

export async function uploadToPublicBucket(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string } | { error: string }> {
  async function attemptUpload() {
    return supabase.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: true,
    });
  }

  let result = await attemptUpload();

  if (result.error) {
    const msg = result.error.message ?? "";
    if (
      msg.toLowerCase().includes("bucket not found") ||
      msg.toLowerCase().includes("not found")
    ) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: true,
      });
      if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
        return { error: `Could not create bucket: ${createErr.message}` };
      }
      result = await attemptUpload();
    }
  }

  if (result.error) {
    return { error: result.error.message };
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: urlData.publicUrl };
}
