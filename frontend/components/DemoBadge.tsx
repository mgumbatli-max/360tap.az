import { FlaskConical } from 'lucide-react';

/**
 * DEMO NİŞANI — NÜMUNƏ ELANI REAL TƏKLİFDƏN AYIRIR.
 *
 * NİYƏ LAZIMDIR: platforma yeni işə düşüb və vitrin boş qalmasın deyə seed ilə
 * nümunə elanlar yerləşdirilib. İstifadəçi onlara zəng edib cavab almasa və ya
 * ödəniş etməyə çalışsa, bu, saytın etibarını birbaşa zədələyir. Ona görə nümunə
 * elan HƏR YERDƏ — kartda da, detal səhifəsində də — açıq işarələnir.
 *
 * NİYƏ BREND RƏNGİ DEYİL: `tap` rəngi platformanın öz vurğusudur (VIP, Premium,
 * CTA). Demo nişanı həmin ailəyə düşsə «irəli çəkilmiş elan» kimi oxunardı —
 * yəni əksinə, DAHA cəlbedici görünərdi. Kəhrəba/amber xəbərdarlıq registridir və
 * platformanın heç bir kommersiya nişanı ilə qarışmır.
 *
 * NİYƏ SERVER KOMPONENTİ: yalnız statik məzhəbdir, interaktivlik yoxdur — klient
 * paketinə əlavə çəki qatmır.
 */

/** Kart üzərində — kiçik, şəklin küncündə. */
export function DemoTag({ className = '' }: { className?: string }) {
  return (
    <span
      // `title` klaviatura/skrinrider istifadəçisi üçün qısa izahı daşıyır.
      title="Bu, platformanın nümunə elanıdır — real təklif deyil"
      className={
        'pointer-events-none inline-flex items-center gap-1 rounded-md bg-amber-500/95 px-1.5 py-0.5 ' +
        'text-[10px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm ' +
        className
      }
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      Demo
    </span>
  );
}

/** Elan detalında — səbəbi izah edən tam eni bant. */
export function DemoNotice({ className = '' }: { className?: string }) {
  return (
    <div
      role="note"
      className={
        'flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 ' +
        'text-[13px] leading-snug text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 ' +
        'dark:text-amber-200 ' +
        className
      }
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-bold">Nümunə (demo) elan.</strong>{' '}
        Bu elan saytın necə işlədiyini göstərmək üçün yerləşdirilib — real təklif deyil,
        göstərilən əlaqə nömrəsi işləmir. Real elanlar artdıqca nümunələr silinəcək.
      </p>
    </div>
  );
}
