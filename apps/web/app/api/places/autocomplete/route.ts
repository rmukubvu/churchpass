import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input") ?? "";

  if (input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input);
    url.searchParams.set("types", "establishment|geocode");
    url.searchParams.set("language", "en");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ predictions: [] });
    }

    const data = (await res.json()) as {
      status: string;
      predictions: Array<{
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text?: string;
        };
      }>;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = (data.predictions ?? []).slice(0, 5).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting.main_text,
      secondaryText: p.structured_formatting.secondary_text ?? "",
    }));

    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
