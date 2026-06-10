// Nearby generator — region-first yaxınlıq üçün.
// haversineKm tək mənbədən (src/modules/geo) gəlir ki, seed və runtime eyni düsturu paylaşsın.
import { haversineKm } from '../../src/modules/geo/utils/haversine';

export { haversineKm };

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
