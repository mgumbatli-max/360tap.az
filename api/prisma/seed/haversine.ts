// Haversine məsafə (km) və nearby generator — region-first yaxınlıq üçün

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface NearbyRow {
  originId: string;
  targetId: string;
  distanceKm: number;
  rank: number;
}

// districts → hər rayon üçün ən yaxın `topN` rayon (≤ maxKm)
export function buildNearby(
  districts: { id: string; lat: number; lng: number }[],
  topN = 6,
  maxKm = 150,
): NearbyRow[] {
  const out: NearbyRow[] = [];
  for (const o of districts) {
    const near = districts
      .filter((t) => t.id !== o.id)
      .map((t) => ({ t, d: haversineKm(o.lat, o.lng, t.lat, t.lng) }))
      .filter((x) => x.d <= maxKm)
      .sort((a, b) => a.d - b.d)
      .slice(0, topN);
    near.forEach((x, i) =>
      out.push({
        originId: o.id,
        targetId: x.t.id,
        distanceKm: Math.round(x.d),
        rank: i,
      }),
    );
  }
  return out;
}
