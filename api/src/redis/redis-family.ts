/**
 * REDIS IP AİLƏSİ — TƏK MƏNBƏ.
 *
 * Həm `RedisModule` (rate limit sayğacı, ERP nonce), həm də `QueueModule` (BullMQ)
 * öz ioredis klientini qurur. Ailə dəyəri ikisində fərqli olsa, biri qoşulub digəri
 * qoşulmaya bilər — və bu, «bəzi funksiyalar işləyir, bəziləri yox» kimi çətin
 * tapılan nasazlıq verər. Ona görə dəyər burada bir dəfə hesablanır.
 *
 * NİYƏ DEFAULT 0: `ioredis` DNS həllində default `family: 4` (yalnız IPv4) işlədir,
 * Render-in daxili şəbəkəsi isə Key Value servisini YALNIZ IPv6 üzərindən verir —
 * nəticədə host həll olunmur və klient sonsuz `reconnecting` dövrəsində qalır
 * (canlıda ölçüldü). `0` Node-un `dns.lookup` çağırışına «hər iki ailəni sına»
 * deməkdir: IPv6-nı MƏCBUR ETMİR, sadəcə mümkün sayır — ona görə lokal
 * `localhost:6379` və klassik IPv4 managed Redis pozulmur.
 */
export function resolveRedisFamily(): number {
  const raw = (process.env.REDIS_FAMILY ?? '').trim();
  if (raw === '') return 0;
  const parsed = Number.parseInt(raw, 10);
  return parsed === 4 || parsed === 6 || parsed === 0 ? parsed : 0;
}
