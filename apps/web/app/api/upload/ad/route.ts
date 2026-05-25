import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createStorageClient, uploadToPublicBucket } from "@/lib/supabase-storage";
import { createId } from "@sanctuary/db";

const BUCKET = "ad-creatives";
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_WIDTH = 600;
const RECOMMENDED_WIDTH = 1200;
const RECOMMENDED_HEIGHT = 400;

export async function POST(req: NextRequest) {
  const { userId } = await auth();

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

  const file = raw;

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image (JPEG, PNG, or WebP)" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dimensions = await readImageDimensions(buffer, file.type);
  if (dimensions) {
    if (dimensions.width < MIN_WIDTH) {
      return NextResponse.json(
        { error: `Image must be at least ${MIN_WIDTH}px wide (got ${dimensions.width}px)` },
        { status: 400 }
      );
    }
  }

  const prefix = userId ?? `guest-${createId()}`;
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${prefix}/${Date.now()}-${sanitizedName}`;

  let supabase;
  try {
    supabase = createStorageClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Storage not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const uploaded = await uploadToPublicBucket(
    supabase,
    BUCKET,
    path,
    buffer,
    file.type
  );

  if ("error" in uploaded) {
    return NextResponse.json({ error: uploaded.error }, { status: 500 });
  }

  const warnings: string[] = [];
  if (dimensions) {
    const ratio = dimensions.width / dimensions.height;
    const target = RECOMMENDED_WIDTH / RECOMMENDED_HEIGHT;
    if (Math.abs(ratio - target) > 0.15) {
      warnings.push(
        `Recommended aspect ratio is 3:1 (${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT}px). Your image is ${dimensions.width}×${dimensions.height}px.`
      );
    }
  }

  return NextResponse.json({
    url: uploaded.publicUrl,
    warnings: warnings.length ? warnings : undefined,
  });
}

/** Best-effort dimensions from PNG/JPEG/WebP headers (no sharp dependency). */
async function readImageDimensions(
  buffer: Buffer,
  mime: string
): Promise<{ width: number; height: number } | null> {
  try {
    if (mime === "image/png" && buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
    if ((mime === "image/jpeg" || mime === "image/jpg") && buffer.length > 2) {
      return parseJpegDimensions(buffer);
    }
    if (mime === "image/webp" && buffer.length >= 30) {
      if (buffer.toString("ascii", 12, 16) === "VP8X" && buffer.length >= 30) {
        return {
          width: 1 + buffer.readUIntLE(24, 3),
          height: 1 + buffer.readUIntLE(27, 3),
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === undefined) break;
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}
