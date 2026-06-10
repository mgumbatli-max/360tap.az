import { haversineKm, buildNearby } from './haversine';

describe('haversine', () => {
  it('Bakı–Sumqayıt ~30km', () => {
    const d = haversineKm(40.4093, 49.8671, 40.5897, 49.6686);
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(45);
  });

  it('buildNearby Qəbələ üçün yaxın rayonları rank-lı qaytarır', () => {
    const districts = [
      { id: 'qebele', lat: 40.9803, lng: 47.8456 },
      { id: 'oguz', lat: 41.0717, lng: 47.4656 },
      { id: 'ismayilli', lat: 40.7878, lng: 48.1517 },
      { id: 'baki', lat: 40.4093, lng: 49.8671 },
    ];
    const rows = buildNearby(districts, 6, 150);
    const qebeleNear = rows
      .filter((r) => r.originId === 'qebele')
      .map((r) => r.targetId);
    expect(qebeleNear).toContain('oguz');
    expect(qebeleNear).toContain('ismayilli');
    // Bakı 150km-dən uzaqdır → daxil olmamalı
    expect(qebeleNear).not.toContain('baki');
  });
});
