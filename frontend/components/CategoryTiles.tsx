import Link from 'next/link';
import CategoryIcon from './CategoryIcon';

/**
 * SERVER KOMPONENT — qəsdən `'use client'` YOXDUR.
 *
 * Plitələr yalnız `<Link>`-dir, heç bir state/hadisə yoxdur. Client sərhədi
 * silinməsi ana səhifənin ilk yükünə əlavə JS gətirmir (SSR performansı).
 */

/**
 * Plitə səthi — NİYƏ CSS dəyişəni ilə, `bg-ink-*` tokeni ilə yox (§12):
 * `globals.css` qaranlıq rejimdə `.dark .bg-ink-50/100/200` üçün `!important`
 * override-lar saxlayır, ona görə həmin tokenlərdə `dark:` variantı heç vaxt tutmur.
 * Üstəlik `layout.tsx`-dəki `main` fonu qaranlıqda məhz `--bg-section`-dir — plitə
 * eyni dəyişəni işlətsəydi fonla birləşib itərdi, ona görə qaranlıqda `--bg-muted`.
 */
const TILE_SURFACE =
  'bg-[var(--bg-section)] hover:bg-ink-200 dark:bg-[var(--bg-muted)] dark:hover:bg-ink-700';

/**
 * Prop kontraktı QƏSDƏN tolerantdır: komponent həm `name_az` (köhnə istifadə),
 * həm də `nameAz` (NestJS `/categories` cavabı) qəbul edir — beləliklə ana səhifə
 * API obyektini birbaşa ötürə bilir və mövcud çağırışlar sınmır.
 */
export type CategoryTile = {
  id: string;
  slug: string;
  name_az?: string;
  nameAz?: string;
  icon?: string | null;
  children?: unknown[];
};

export default function CategoryTiles({
  categories,
  limit = 10,
}: {
  categories: CategoryTile[];
  /** Spesifikasiya §5.1 — lg-də 5 sütun × 2 sətir = 10 plitə. */
  limit?: number;
}) {
  const items = limit > 0 ? categories.slice(0, limit) : categories;

  return (
    // `min-w-0`: grid elementinin susmaya görə `min-width:auto`-su uzun kateqoriya
    // adını sütun eninə çevirir və 320px ekranda üfüqi sürüşmə yaradırdı (§11).
    <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
      {items.map((c) => {
        const name = c.nameAz ?? c.name_az ?? c.slug;
        return (
          <Link
            key={c.id}
            href={`/elanlar?category=${c.slug}`}
            className={`group relative block h-[120px] min-w-0 overflow-hidden rounded-2xl p-4 transition-colors ${TILE_SURFACE}`}
          >
            {/*
              Mətn sol-yuxarı (§5.1). Sağ paddinq ikon dairəsinin enidir —
              uzun kateqoriya adı ikonun altına girməsin. Mobildə dairə 48px-dir:
              2 sütunlu dar plitədə 56px ada demək olar ki, yer qoymurdu (§11).
            */}
            <span className="block pr-14 text-[15px] font-semibold leading-snug text-ink-900 line-clamp-2 md:pr-16">
              {name}
            </span>

            {/*
              İkon SAĞ-AŞAĞI küncdə (§5.1). Vahid `CategoryIcon` sistemi:
              qradiyentli plitə + ağ qalın qlif. Əvvəlki «solğun dairə + nazik
              xətt» forması kiçik ölçüdə demək olar görünmürdü.
            */}
            <span className="pointer-events-none absolute bottom-3 right-3 transition-transform duration-200 group-hover:scale-105">
              <CategoryIcon slug={c.slug} name={name} size="lg" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
