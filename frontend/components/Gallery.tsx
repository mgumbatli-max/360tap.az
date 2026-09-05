'use client';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { safeImageUrl } from '@/lib/image-hosts';

/**
 * Elan detalı qalereyası (§7.1.3): böyük şəkil + yanlarda dairəvi ‹ › + altda thumb sətri.
 *
 * Prop imzası (`images`, `title`) qəsdən dəyişdirilməyib — səhifə `l.images ?? []`
 * ötürür və şəkil obyektinin yalnız `url` sahəsinə etibar edir.
 *
 * ŞƏKİL ÇATDIRILMASI: `next/image` (optimizator) — ölçülmüş fərq böyükdür,
 * eyni fayl xam halda 2.4 MB, `w=1080&q=75` ilə 64 KB idi; thumbnail zolağı isə
 * 72×54 px üçün TAM ölçülü faylı endirirdi. Xam `<img>` YALNIZ allowlist-dən
 * kənar host üçün qalır: `next/image` belə URL-də istisna atır və bütün detal
 * səhifəsini çökdürür (bax `lib/image-hosts.ts`), ona görə orada optimizasiyadan
 * imtina edilir — şəklin itməsindənsə optimallaşmamış göstərilməsi yaxşıdır.
 */
export default function Gallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;

  // `active` şəkil siyahısından böyük ola bilməz (məs. şəkil silinəndə) — clamp saxlanılır.
  const idx = count > 0 ? Math.min(active, count - 1) : 0;

  // Dövrü keçid: sonuncudan ‹ birinciyə qayıdır ki, ox düymələri heç vaxt "ölü" olmasın.
  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setActive((prev) => (Math.min(prev, count - 1) + delta + count) % count);
    },
    [count],
  );

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <span className="text-sm">Şəkil yoxdur</span>
      </div>
    );
  }

  const heroSrc = safeImageUrl(images[idx].url);

  const navBtn =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full ' +
    'bg-white/90 text-ink-800 shadow-soft transition hover:bg-white dark:bg-ink-800/90 dark:text-white dark:hover:bg-ink-800';

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={title}
            fill
            // Əsas sütun ≤1024px-də tam en, ondan yuxarı 400px-lik sağ rels çıxılır.
            sizes="(max-width: 1024px) 100vw, 900px"
            // Hero LCP elementidir — `priority` onu preload sırasına salır.
            priority
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[idx].url} alt={title} className="h-full w-full object-cover" />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Əvvəlki şəkil"
              className={`${navBtn} left-3`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Növbəti şəkil"
              className={`${navBtn} right-3`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-xs font-semibold text-white">
              {idx + 1}/{count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        // Thumb sətri yalnız ÖZ içində üfüqi sürüşür — səhifə gövdəsi sürüşmür (§11).
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const thumbSrc = safeImageUrl(img.url);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1}-ci şəkil`}
                aria-current={i === idx ? 'true' : undefined}
                className={`h-[54px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === idx
                    ? 'border-tap'
                    : 'border-transparent hover:border-ink-300 dark:hover:border-ink-600'
                }`}
              >
                {thumbSrc ? (
                  // 72×54 CSS px, 2x ekran üçün 144 — optimizator məhz bu ölçüdə
                  // variant qaytarır, tam ölçülü faylı yox.
                  <Image
                    src={thumbSrc}
                    alt=""
                    width={144}
                    height={108}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
