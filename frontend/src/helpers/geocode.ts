export type GeoCandidate = {
  label: string;
  lat: number;
  lng: number;
};

const COMMON_HEADERS = {
  "Accept-Language": "en",
  "User-Agent": "NoLeftovers/1.0",
};

export async function searchAddress(q: string, limit = 5): Promise<GeoCandidate[]> {
  if (!q.trim()) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url.toString(), { headers: COMMON_HEADERS });
  const j = (await r.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return (j || [])
    .map((it) => ({
      label: it.display_name,
      lat: parseFloat(it.lat),
      lng: parseFloat(it.lon),
    }))
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  const r = await fetch(url.toString(), { headers: COMMON_HEADERS });
  const j = await r.json();
  return (j?.display_name as string) || null;
}
