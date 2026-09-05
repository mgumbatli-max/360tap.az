/**
 * Region/rayon slug-larının formatı: kiçik latın hərfi, rəqəm və defis.
 *
 * NİYƏ LAZIMDIR: xam slug birbaşa `findUnique({ where: { slug } })`-a
 * ötürüləndə `%00` (NUL) kimi idarəedici simvollar Postgres-ə çatır və sürücü
 * 500 (`DatabaseError`) qaytarır — halbuki mövcud olmayan slug üçün düzgün
 * cavab 404-dür. Ölçülmüşdü: `/geo/regions/baki%00/districts` → 500,
 * `/geo/regions/YOXDUR/districts` → 404.
 *
 * Naxış bazadakı bütün mövcud slug-ları örtür (regionlar və `baki-nesimi`
 * tipli rayonlar da daxil), ona görə işləyən sorğuları qırmır.
 */
const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

export function isSafeSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
