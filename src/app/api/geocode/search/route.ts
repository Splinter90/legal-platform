import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

export async function GET(req: NextRequest) {
  const rl = rateLimit({
    key: `geocode-search:${getClientIp(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const city = searchParams.get("city")?.trim();
  const province = searchParams.get("province")?.trim();
  if (q.length < 3) return NextResponse.json({ results: [] });

  const query = [q, city, province, "Argentina"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "6",
    countrycodes: "ar",
  })}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LeyesDigital/1.0 (contacto@leyesdigital.com)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const raw = (await res.json()) as NominatimResult[];
    const results = (Array.isArray(raw) ? raw : []).map((r) => {
      const street = r.address?.road || r.address?.pedestrian || "";
      const houseNumber = r.address?.house_number || "";
      const address = [street, houseNumber].filter(Boolean).join(" ") || r.display_name.split(",")[0];
      return {
        label: r.display_name,
        address,
        city:
          r.address?.city ||
          r.address?.town ||
          r.address?.village ||
          r.address?.suburb ||
          "",
        province: r.address?.state || "",
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
      };
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
