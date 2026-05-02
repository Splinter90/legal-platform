export async function geocodeAddress(
  city: string,
  province: string,
  address?: string | null
): Promise<{ latitude: number; longitude: number } | null> {
  const query = [address, city, province, "Argentina"]
    .filter(Boolean)
    .join(", ");

  try {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ar",
    })}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "LegalConnect/1.0" },
    });

    if (!res.ok) return null;

    const results = await res.json();
    if (results.length === 0) return null;

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}
