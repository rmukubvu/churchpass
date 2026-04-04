export interface NearbyHotel {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number | null;
  vicinity: string;
  photoRef: string | null;
  distanceKm: number;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hotelPhotoUrl(photoRef: string, maxWidth = 400): string {
  const key = process.env["GOOGLE_PLACES_API_KEY"];
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${key}`;
}

export async function searchNearbyHotels(
  lat: number,
  lng: number,
  radiusMeters = 5000
): Promise<NearbyHotel[]> {
  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key) return [];

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("type", "lodging");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    status: string;
    results: Array<{
      place_id: string;
      name: string;
      rating?: number;
      user_ratings_total?: number;
      vicinity: string;
      photos?: Array<{ photo_reference: string }>;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];
  if (!data.results?.length) return [];

  return data.results
    .slice(0, 8)
    .map((p) => ({
      placeId: p.place_id,
      name: p.name,
      rating: p.rating ?? null,
      userRatingsTotal: p.user_ratings_total ?? null,
      vicinity: p.vicinity,
      photoRef: p.photos?.[0]?.photo_reference ?? null,
      distanceKm: haversineKm(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
