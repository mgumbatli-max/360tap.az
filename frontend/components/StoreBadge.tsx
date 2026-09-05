import Link from 'next/link';
import { BadgeCheck, Store as StoreIcon } from 'lucide-react';

/**
 * MAĞAZA NİŞANI — elan kartında, elan detalında və mağaza kataloqunda eyni görünüş.
 *
 * NİYƏ ayrıca komponent: mağaza kimliyi (ad + təsdiq işarəsi + vitrinə keçid) üç ayrı
 * yerdə göstərilir. Üç yerdə üç fərqli markup olsa, «təsdiqlənmiş» işarəsi bir yerdə
 * göstərilib digərində unudulardı — istifadəçi üçün etibar siqnalı isə yalnız
 * HƏR YERDƏ eyni göründükdə mənalıdır.
 *
 * `slug` yoxdursa keçid verilmir (ölü link göstərmək istifadəçini aldadır),
 * yalnız etiket kimi render olunur.
 */
export default function StoreBadge({
  name,
  slug,
  isVerified = false,
  size = 'sm',
  tone = 'muted',
  className = '',
}: {
  name: string;
  slug?: string | null;
  isVerified?: boolean;
  size?: 'sm' | 'md';
  /**
   * `muted` — ikinci dərəcəli kontekst (elan kartında satıcı sətri).
   * `strong` — nişanın özü başlıqdırsa (mağaza kataloqu kartı).
   * NİYƏ prop: rəngi `className` ilə üstələmək Tailwind-də sinif SIRASINDAN asılıdır
   * (eyni spesifiklik) — yəni təsadüfi nəticə verir. Açıq variant seçimi determinikdir.
   */
  tone?: 'muted' | 'strong';
  className?: string;
}) {
  const text = size === 'md' ? 'text-sm' : 'text-[12px]';
  const icon = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const color =
    tone === 'strong'
      ? 'font-bold text-ink-900 dark:text-ink-50'
      : 'text-ink-600 dark:text-ink-300';

  const body = (
    <>
      <StoreIcon className={`${icon} shrink-0`} aria-hidden="true" />
      <span className={`truncate ${tone === 'strong' ? '' : 'font-medium'}`}>{name}</span>
      {isVerified && (
        // Rəng tokeni: `success` — brend rəngi ilə yarışmasın, amma «yoxlanılıb» oxunsun.
        <BadgeCheck
          className={`${icon} shrink-0 text-success`}
          aria-label="Təsdiqlənmiş mağaza"
          role="img"
        />
      )}
    </>
  );

  const base = `inline-flex min-w-0 max-w-full items-center gap-1 ${text} ${color}`;

  if (!slug) {
    return <span className={`${base} ${className}`}>{body}</span>;
  }

  return (
    <Link
      href={`/magaza/${slug}`}
      className={`${base} rounded transition-colors hover:text-tap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap focus-visible:ring-offset-1 ${className}`}
      aria-label={`${name} mağazasının səhifəsi`}
    >
      {body}
    </Link>
  );
}
