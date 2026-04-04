import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "event-banners";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const raw = formData.get("file");
  if (!raw || !(raw instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const file: File = raw;

  // Validate mime type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  // Build storage path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${sanitizedName}`;
  const contentType = file.type;

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Attempt upload, auto-creating bucket on "Bucket not found"
  async function attemptUpload() {
    return supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
  }

  let result = await attemptUpload();

  if (result.error) {
    const msg = result.error.message ?? "";
    if (msg.toLowerCase().includes("bucket not found") || msg.toLowerCase().includes("not found")) {
      // Try to create the bucket then retry
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ error: `Could not create bucket: ${createErr.message}` }, { status: 500 });
      }
      result = await attemptUpload();
    }
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  // Get the public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
