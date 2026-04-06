import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const maxWidth = req.nextUrl.searchParams.get("w") ?? "400";

  if (!ref) return new NextResponse("Missing ref", { status: 400 });

  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key) return new NextResponse("No API key", { status: 500 });

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${key}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse("Photo fetch failed", { status: res.status });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch photo", { status: 500 });
  }
}
