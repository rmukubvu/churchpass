export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const key = process.env["GOOGLE_PLACES_API_KEY"];
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };

  if (data.status !== "OK" || !data.results[0]) return null;

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
