'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ATILAN NAVİQASİYAYA QARŞI QORUMA.
 *
 * ÖLÇÜLMÜŞ DEFEKT (2026-09-06, Next.js 15.5.19, lokal production build):
 * `/elanlar` səhifəsində filtr seçimlərinin təxminən **5%-i səssizcə itir**
 * (ayrı-ayrı ölçmələr: 1/20, 1/20, 3/40, 1/40, 2/80 — Playwright müdaxiləsi ilə də,
 * onsuz da eyni, yəni test qoşqusunun artefaktı DEYİL).
 *
 * Brauzer izi (40 icradan tutulmuş sınıq, səhifə daxilindən instrumentasiya ilə):
 *   fetch başladı  /elanlar?...&a_brand=BMW&_rsc=...   signal=VAR
 *   fetch OK 200
 *   ...və BİTDİ — `pushState` yoxdur, `abort()` çağırılmır, konsol xətası yoxdur,
 *   tutulmamış rədd yoxdur, TƏKRAR SORĞU getmir. Şəbəkə qatında cavabın gövdəsi
 *   `net::ERR_ABORTED` ilə kəsilir, çünki axını oxuyacaq tərəf onu atır.
 * Yəni App Router RSC cavabını ALIR, sonra tranzisiyanı commit ETMİR: URL dəyişmir,
 * `value={...}` ilə idarə olunan `<select>` köhnə dəyərinə qayıdır və istifadəçi
 * filtri seçib **heç nə baş vermədiyini** görür. Heç bir əlamət qalmadığı üçün bu,
 * ən pis növ nasazlıqdır — nə istifadəçi, nə də log onu görür.
 *
 * Səbəbin bizdən kənarda olduğunun sübutu:
 *  · Next mənbəyində `abort()` yalnız `pagehide`-da çağırılır
 *    (`node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:55`),
 *    həmin hadisə isə baş vermir.
 *  · React-i RC-dən stabil 19.1.1-ə keçirmək TƏSİR ETMƏDİ (ölçüldü: 3/40 → yenə var).
 *  · Backend 429/5xx qaytarmır, hidratasiya tamdır, konsol təmizdir.
 *
 * NİYƏ BELƏ HƏLL: səbəb router-in daxilindədir, biz onu yamaya bilmərik. Ona görə
 * naviqasiyanın HƏQİQƏTƏN baş verdiyini yoxlayırıq; baş verməyibsə sərt naviqasiya
 * ilə tamamlayırıq. Sərt keçid bir az yavaşdır, amma HƏMİŞƏ işləyir — sükutla itən
 * filtrdən sonsuz dəfə yaxşıdır. Ölçüldü: qoruyucu ilə 160 icrada istifadəçi üçün
 * sınıq SIFIRDIR.
 *
 * NİYƏ `useTransition`/`isPending` İŞLƏTMİRİK: sınandı və ÖLÇÜLDÜ — atılma halında
 * `isPending` ƏBƏDİ `true` qalır (reducer promise-i heç vaxt settle olmur, ona görə
 * `use(state)` suspend-də ilişir). Yəni o siqnal atılmanı normal gözləmədən AYIRD
 * EDƏ BİLMİR; onunla bərpa 8 saniyəyə uzanırdı (ölçüldü: 8079 ms və 8067 ms).
 * Yeganə işlək ölçü — ünvanın verilmiş müddət ərzində dəyişib-dəyişməməsidir.
 */

/**
 * Nə qədər gözləyib sərt keçidə düşürük.
 * Ölçmə əsası: lokalda normal yumşaq naviqasiya median **24 ms**, maksimum **172 ms**
 * çəkir (40 icra). 2.5 saniyə bundan on dəfələrlə boldur, yəni yavaş şəbəkədə də
 * normal keçidi kəsmirik; digər tərəfdən istifadəçini 8 saniyə gözlətmir.
 * Səhv tərəfə keçsək belə nəticə DOĞRUDUR — sadəcə səhifə tam yenidən yüklənir.
 */
const RECOVERY_MS = 2500;

/**
 * `pathname + search`-i müqayisə üçün normallaşdırır.
 * Kodlaşdırma (`+` ↔ `%20`) və parametr sırası fərqi yalançı «dəyişmədi» siqnalı
 * verməsin deyə parametrlər ayrıca sıralanır.
 */
export function normalizeUrl(href: string): string {
  const u = new URL(href, window.location.origin);
  const p = new URLSearchParams(u.search);
  p.sort();
  const qs = p.toString();
  return u.pathname + (qs ? `?${qs}` : '');
}

/**
 * Sərt keçidi BİR DƏFƏ icra edir.
 *
 * NİYƏ LAZIMDIR (canlıda ölçüldü): eyni klik iki qoruyucuya düşə bilir — çipin öz
 * `onClick`-i (`useResilientPush`) və `NavigationGuard`-ın sənəd səviyyəsindəki
 * dinləyicisi. Hər ikisi eyni anda `location.assign` çağırsaydı, birinci sənəd
 * sorğusu ikincisi tərəfindən ləğv olunurdu və şəbəkədə `GET /elanlar —
 * net::ERR_ABORTED` görünürdü (istifadəçi üçün zərərsiz, amma yalançı nasazlıq
 * siqnalı və lüzumsuz sorğu). Bayraq sıfırlanmır: səhifə onsuz da tərk edilir.
 */
let recovering = false;

export function recoverNavigation(url: string): void {
  if (recovering) return;
  recovering = true;
  window.location.assign(url);
}

/**
 * `router.push` əvəzedicisi: naviqasiya atılarsa sərt keçidlə tamamlayır.
 * İstifadə: `const push = useResilientPush(); push('/elanlar?region=baki');`
 */
export function useResilientPush(): (url: string) => void {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Komponent sökülərkən gözləyən taymer qalmasın — sökülmüş səhifə üçün sərt
  // naviqasiya istifadəçini gözlənilmədən geri atardı.
  useEffect(() => clear, []);

  return useCallback(
    (url: string) => {
      clear();

      const from = normalizeUrl(window.location.href);
      const to = normalizeUrl(url);
      if (from === to) return; // eyni ünvan — naviqasiya lazım deyil

      router.push(url);

      timer.current = setTimeout(() => {
        timer.current = null;
        const now = normalizeUrl(window.location.href);
        if (now === to) return; // naviqasiya baş verdi — hər şey qaydasındadır
        // İstifadəçi aralıqda BAŞQA səhifəyə keçibsə müdaxilə etmirik: onu
        // getdiyi yerdən geri sürükləmək daha pis nasazlıq olardı.
        if (now !== from) return;
        recoverNavigation(url);
      }, RECOVERY_MS);
    },
    [router],
  );
}
