# QRUP SƏRHƏDLƏRİ ÜST-ÜSTƏ DÜŞƏN FAYLLAR — İŞ BİTƏNDƏN SONRA YOXLA
Bucketing `files` sahəsinin BİRİNCİ faylına görə aparıldı, lakin bəzi tapıntılar
bir neçə fayl sadalayır → iki agent eyni fayla toxuna bilər (son yazan qalib gəlir).

YOXLANMALI:
- frontend/app/k/[category]/page.tsx      (fe_seo ⟷ fe_other)
- frontend/app/seher/[city]/page.tsx      (fe_seo ⟷ fe_other)
- frontend/lib/server-fetch.ts            (fe_other ⟷ fe_seo)
- frontend/app/elanlar/page.tsx           (fe_listings ⟷ fe_other)
- frontend/components/AuthModal.tsx       (fe_other ⟷ ?)
- frontend/app/qeydiyyat/page.tsx         (fe_other ⟷ ?)
- api/src/modules/auth/auth.controller.ts (fe_other-ə YAD — api_domain-in sahəsi)

YOXLAMA ÜSULU: hər faylda hər iki tapıntının gözlənilən düzəlişi varmı?
Yoxdursa itən düzəlişi əl ilə tətbiq et.
