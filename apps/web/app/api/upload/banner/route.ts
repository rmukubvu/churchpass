import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createStorageClient, uploadToPublicBucket } from "@/lib/supabase-storage";

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

  let supabase;
  try {
    supabase = createStorageClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Storage not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const uploaded = await uploadToPublicBucket(supabase, BUCKET, path, buffer, contentType);
  if ("error" in uploaded) {
    return NextResponse.json({ error: uploaded.error }, { status: 500 });
  }

  return NextResponse.json({ url: uploaded.publicUrl });
}
