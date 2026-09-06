'use client';
import { useEffect } from 'react';
import { normalizeUrl } from '@/lib/resilient-navigation';

/**
 * DAXİLİ KEÇİDLƏR ÜÇÜN ATILMA QORUYUCUSU.
 *
 * Eyni defekt filtr seçimlərində olduğu kimi ADİ KEÇİDLƏRDƏ də baş verir: istifadəçi
 * kateqoriya linkinə basır, App Router RSC cavabını alır, sonra tranzisiyanı commit
 * etmir — səhifə dəyişmir, heç bir xəta görünmür. Ölçüldü: `/elanlar?category=neqliyyat`
 * səhifəsində «avtomobiller» linkinə klik E2E-də təkrar-təkrar 30 saniyəlik
 * `waitForURL` timeout-u ilə bitirdi (`e2e/01-public.spec.ts:74`), halbuki eyni ünvan
 * birbaşa açılanda dərhal işləyir.
 *
 * Defektin mexanizmi, ölçmələri və niyə kod tərəfindən düzəldilə bilmədiyi:
 * `lib/resilient-navigation.ts` şərhi.
 *
 * NİYƏ QLOBAL DİNLƏYİCİ: defekt İSTƏNİLƏN `<Link>`-i vura bilər, hər keçid yerini
 * ayrıca sarımaq isə həm yüzlərlə yerə toxunmaq, həm də növbəti yazılan linkin
 * yenidən qorumasız qalması demək olardı. Bir dinləyici bütün daxili keçidləri örtür.
 *
 * NİYƏ TƏHLÜKƏSİZDİR — bərpa YALNIZ bu şərtlər birlikdə doğru olanda işə düşür:
 *   1. sol klik, dəyişdirici düymə yoxdur, `target`/`download` yoxdur, eyni origin
 *      və hədəf ünvan CARİ ünvandan FƏRQLİDİR (yəni `#` çövrələri kənarda qalır);
 *   2. güzəşt müddətindən sonra ünvan HƏLƏ dəyişməyib;
 *   3. istifadəçi hələ də klik etdiyi səhifədədir (aralıqda başqa yerə keçibsə
 *      müdaxilə etmirik — onu geri sürükləmək daha pis olardı).
 *
 * Naviqasiyanı QƏSDƏN dayandıran keçid (məsələn modal açan `<a>`) bu şərtlərə düşərdi;
 * belə keçidə `data-nav-guard="off"` qoymaq kifayətdir. Hazırda kod bazasında belə
 * keçid yoxdur — yoxlanıldı: `preventDefault` yalnız forma göndərişlərində və
 * klaviatura idarəsindədir, heç bir `<a>` naviqasiyasını ləğv etmir.
 */

/** Eyni əsaslandırma ilə `lib/resilient-navigation.ts`-dəki hədd. */
const RECOVERY_MS = 2500;

export default function NavigationGuard() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target;
      if (!(target instanceof Element)) return;
      const a = target.closest('a[href]');
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.dataset.navGuard === 'off') return;
      if (a.hasAttribute('download')) return;
      if (a.target && a.target !== '_self') return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const to = normalizeUrl(url.href);
      const from = normalizeUrl(window.location.href);
      if (to === from) return; // eyni ünvan və ya sırf `#` çövrəsi — keçid gözlənilmir

      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const now = normalizeUrl(window.location.href);
        if (now !== from) return; // ya keçid oldu, ya istifadəçi başqa yerə getdi
        window.location.assign(url.href);
      }, RECOVERY_MS);
    };

    // Tutma (capture) fazası: `<Link>` öz `preventDefault`-unu etməzdən əvvəl niyyəti oxuyuruq.
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  return null;
}
