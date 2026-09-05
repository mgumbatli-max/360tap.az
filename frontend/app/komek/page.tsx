'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Mail, Search } from 'lucide-react';

/**
 * YARDIM SƏHİFƏSİ — REAL SUALLAR, REAL CAVABLAR.
 *
 * ƏVVƏLKİ VƏZİYYƏT: səhifə 64 sual BAŞLIĞINDAN ibarət idi, hər biri `href="#"` —
 * yəni istifadəçi klikləyirdi, heç nə açılmırdı. Üstəlik mövzuların böyük hissəsi
 * platformada ÜMUMİYYƏTLƏ olmayan xidmətləri vəd edirdi (ödəniş, tariflər,
 * «360tap səyahət», «360tap Garantiya», zəng asistenti). Bu, sadəcə ölü keçid
 * deyil — yanlış vəddir: istifadəçi mövcud olmayan xidmətə güvənir.
 *
 * İNDİKİ QAYDA: burada YALNIZ bu gün işləyən funksiyalar haqqında sual var və hər
 * sualın cavabı yazılıb. Yeni funksiya (ödəniş, paketlər, çatdırılma) canlıya
 * çıxanda müvafiq bölmə buraya ƏLAVƏ olunur — əvvəlcədən yox.
 *
 * Axtarış qutusu da real işləyir: əvvəl yazılan mətn heç yerdə istifadə olunmurdu.
 */

type Qa = { q: string; a: React.ReactNode };
type Topic = { title: string; items: Qa[] };

const TOPICS: Topic[] = [
  {
    title: 'Başlanğıc',
    items: [
      {
        q: '360tap.az nədir və necə işləyir?',
        a: '360tap.az Azərbaycan üçün elan platformasıdır: satıcı elan yerləşdirir, alıcı axtarır və satıcı ilə birbaşa əlaqə saxlayır. Platforma alqı-satqının özünə qarışmır — ödəniş və çatdırılma tərəflər arasında razılaşdırılır.',
      },
      {
        q: 'Qeydiyyat pulludurmu?',
        a: (
          <>
            Xeyr. Qeydiyyat da, elan yerləşdirmək də hazırda tamamilə pulsuzdur.{' '}
            <Link href="/qeydiyyat" className="font-semibold text-tap hover:underline">Hesab yarat</Link>.
          </>
        ),
      },
      {
        q: 'Hesabımı e-poçtla, yoxsa telefonla yarada bilərəm?',
        a: 'Hər ikisi ilə — qeydiyyatda e-poçt və ya telefondan ən azı biri tələb olunur. E-poçt yazsanız, ünvanınıza təsdiq məktubu göndərilir.',
      },
      {
        q: 'Parolumu unutmuşam.',
        a: (
          <>
            <Link href="/sifre-unutdum" className="font-semibold text-tap hover:underline">Parolu unutdum</Link>{' '}
            səhifəsində e-poçt ünvanınızı yazın — bərpa keçidi göndəriləcək. Keçid müəyyən müddət sonra
            etibarsız olur, ona görə məktub gəldikdən sonra ləngiməyin.
          </>
        ),
      },
    ],
  },
  {
    title: 'Elan yerləşdirmək',
    items: [
      {
        q: 'Necə elan yerləşdirim?',
        a: (
          <>
            Yuxarıdakı{' '}
            <Link href="/elan-yerlesdir" className="font-semibold text-tap hover:underline">Elan yerləşdir</Link>{' '}
            düyməsini basın. Ardıcıllıq: kateqoriya → başlıq və təsvir → xüsusiyyətlər → qiymət → şəkillər →
            yerləşmə → əlaqə.
          </>
        ),
      },
      {
        q: 'Niyə kateqoriyanı ƏVVƏLCƏ seçmək lazımdır?',
        a: 'Çünki xüsusiyyət sahələri kateqoriyadan asılıdır: avtomobildə marka, model, yürüş və yanacaq soruşulur, mənzildə otaq sayı və sahə, vakansiyada isə maaş və iş qrafiki. Kateqoriyanı sonradan dəyişsəniz, həmin sahələr yenidən doldurulmalıdır.',
      },
      {
        q: 'Başlıq və təsvir üçün hədlər nədir?',
        a: 'Başlıq 10–120 simvol, təsvir 20–5000 simvol olmalıdır. Qısa və konkret başlıq («iPhone 14 Pro 256GB, zəmanətli») ümumi başlıqdan («telefon satılır») qat-qat çox baxış alır.',
      },
      {
        q: 'Neçə şəkil əlavə edə bilərəm?',
        a: 'Bir elana 8-ə qədər şəkil. Hər faylın həcmi 8 MB-ı keçməməlidir. Birinci şəkil elanın üz qabığı olur — ən yaxşısını əvvələ qoyun.',
      },
      {
        q: 'Qiymət yazmaq məcburidirmi?',
        a: '«Razılaşma yolu ilə», «Pulsuz» və «Barter» kimi qiymət növləri var — onları seçsəniz məbləğ tələb olunmur. Qiymət yazsanız mənfi ola bilməz.',
      },
    ],
  },
  {
    title: 'Elanlarımın idarəsi',
    items: [
      {
        q: 'Elanı necə redaktə edim?',
        a: (
          <>
            <Link href="/profil/elanlarim" className="font-semibold text-tap hover:underline">Elanlarım</Link>{' '}
            bölməsində elanın yanındakı redaktə keçidini seçin. Başlıq, təsvir, qiymət, əlaqə və
            xüsusiyyətlər dəyişdirilə bilər.
          </>
        ),
      },
      {
        q: 'Elanı necə silim?',
        a: 'Elan tam silinmir — arxivləşdirilir. «Elanlarım» bölməsində «Arxiv» düyməsi elanı siyahıdan çıxarır və o, artıq axtarışda görünmür. İstədiyiniz vaxt «Aktivləşdir» ilə geri qaytara bilərsiniz. Bu, səhvən silinmiş elanı bərpa etmək üçündür.',
      },
      {
        q: 'Məhsul satıldı — nə etməli?',
        a: '«Satıldı» düyməsini basın. Elan aktiv siyahıdan çıxır, amma tarixçənizdə qalır. Bu, alıcıların artıq mövcud olmayan mala zəng etməsinin qarşısını alır.',
      },
      {
        q: 'Elanım nə qədər müddətə aktivdir?',
        a: 'Elan dərc olunduqdan sonra siz onu arxivləşdirənə və ya «Satıldı» edənə qədər aktiv qalır. Avtomatik silinmə tətbiq olunmur.',
      },
      {
        q: 'Nə qədər elan yerləşdirə bilərəm?',
        a: 'Hazırda say limiti tətbiq olunmur. Limitlər gələcəkdə tətbiq olunarsa, bu barədə əvvəlcədən məlumat veriləcək.',
      },
    ],
  },
  {
    title: 'Axtarış və filtrlər',
    items: [
      {
        q: 'Axtarışı necə dəqiqləşdirim?',
        a: 'Kateqoriyaya daxil olun — həmin sahəyə xas filtrlər açılır (avtomobildə marka/model/il/yürüş, əmlakda otaq/sahə/əməliyyat növü, vakansiyada maaş/qrafik). Region və qiymət aralığı bütün kateqoriyalarda mövcuddur.',
      },
      {
        q: 'Marka seçdim, model siyahısı boşdur.',
        a: 'Model siyahısı seçilmiş markadan asılıdır — əvvəlcə markanı seçin, sonra model siyahısı həmin markanın modelləri ilə dolur.',
      },
      {
        q: 'Elanı sonraya saxlaya bilərəmmi?',
        a: (
          <>
            Bəli — elanın üzərindəki ürək işarəsi onu{' '}
            <Link href="/profil/sevimliler" className="font-semibold text-tap hover:underline">Sevimlilər</Link>{' '}
            siyahınıza əlavə edir. Siyahının hesabınızda saxlanması üçün daxil olmalısınız.
          </>
        ),
      },
    ],
  },
  {
    title: 'Satıcı ilə əlaqə',
    items: [
      {
        q: 'Satıcıya necə zəng edim?',
        a: 'Elan səhifəsindəki «Telefonu göstər» düyməsini basın — nömrə açılır və mobil cihazda birbaşa zəng edilə bilər. Nömrə əvvəlcədən gizlidir ki, avtomatik toplayıcılardan qorunsun.',
      },
      {
        q: 'WhatsApp düyməsi niyə hər elanda yoxdur?',
        a: 'Çünki onu satıcı özü aktivləşdirir. Elan yerləşdirərkən «WhatsApp ilə əlaqə» seçimini işarələsəniz, elanınızda WhatsApp keçidi görünəcək.',
      },
      {
        q: 'Cavab gəlmir, nə etməli?',
        a: 'Satıcı platformadan kənar şəxsdir və cavab verməyə borclu deyil. Elan artıq aktual deyilsə və ya saxta görünürsə, elan səhifəsindəki şikayət düyməsi ilə bizə bildirin.',
      },
    ],
  },
  {
    title: 'Təhlükəsizlik',
    items: [
      {
        q: 'Saxta elandan necə qorunum?',
        a: 'Malı görmədən və yoxlamadan beh və ya avans göndərməyin. Bazar qiymətindən kəskin ucuz təklif ən çox rast gəlinən fırıldaq siqnalıdır. Görüşü ictimai yerdə təyin edin.',
      },
      {
        q: 'Şübhəli elanı necə bildirim?',
        a: 'Elan səhifəsində şikayət düyməsi var — səbəbi seçib göndərin. Şikayətlər moderasiyaya düşür.',
      },
      {
        q: 'Platforma ödənişə zəmanət verirmi?',
        a: 'Xeyr. 360tap.az hazırda ödənişi emal etmir və tərəflər arasında vasitəçilik etmir — bütün hesablaşma alıcı və satıcı arasındadır. Ona görə də sayt adından pul tələb edən hər kəs fırıldaqçıdır.',
      },
    ],
  },
  {
    title: 'Mağazalar',
    items: [
      {
        q: 'Mağaza hesabı nədir?',
        a: (
          <>
            Mağaza — öz vitrin səhifəsi, loqosu və elanlarının bir yerdə toplandığı satıcı profilidir.{' '}
            <Link href="/biznes" className="font-semibold text-tap hover:underline">Biznes bölməsində</Link>{' '}
            ətraflı oxuya bilərsiniz.
          </>
        ),
      },
      {
        q: 'Mağaza açmaq pulludurmu?',
        a: 'Xeyr, hazırda mağaza qeydiyyatı pulsuzdur. Ödənişli paketlər hələ aktiv deyil.',
      },
    ],
  },
];

const ALL = TOPICS.flatMap((t) => t.items.map((it) => ({ ...it, topic: t.title })));

/** Diakritikaya həssas olmayan müqayisə — istifadəçi «musteri» də yaza bilər. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ş/g, 's').replace(/ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u');
}

function toText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toText).join(' ');
  const el = node as { props?: { children?: React.ReactNode } };
  return el.props ? toText(el.props.children) : '';
}

function Accordion({ item }: { item: Qa }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-ink-200 last:border-0 dark:border-ink-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 py-3 text-left text-sm font-medium text-ink-800 hover:text-tap dark:text-ink-100"
      >
        <span>{item.q}</span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="pb-4 pr-6 text-[13px] leading-relaxed text-ink-600 dark:text-ink-300">
          {item.a}
        </div>
      )}
    </li>
  );
}

export default function HelpPage() {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const needle = fold(q.trim());
    if (needle.length < 2) return null;
    return ALL.filter(
      (it) => fold(it.q).includes(needle) || fold(toText(it.a)).includes(needle),
    );
  }, [q]);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900">
      <section className="border-b border-ink-200 bg-white py-10 dark:border-ink-700 dark:bg-ink-800">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-2 flex justify-center">
            <div className="flex items-center gap-1 text-2xl">
              <span className="logo-dots inline-grid"><span /><span /><span /><span /></span>
              <span className="ml-1 font-bold">360tap Yardım</span>
            </div>
          </div>

          <h1 className="mb-5 mt-6 text-center text-2xl font-extrabold md:text-3xl">
            Populyar suallara cavablar
          </h1>

          <div className="search-bar">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sualınızı yazın — məs: elanı necə silim"
                aria-label="Yardım mövzularında axtar"
                className="search-input pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {results ? (
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
              {results.length > 0
                ? `${results.length} nəticə tapıldı`
                : 'Bu sorğu üzrə cavab tapılmadı — aşağıdakı e-poçtla bizə yazın.'}
            </p>
            {results.length > 0 && (
              <ul className="card px-5 py-1">
                {results.map((it) => (
                  <Accordion key={it.q} item={it} />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t) => (
              <div key={t.title} className="card px-5 py-1">
                <h2 className="border-b border-ink-200 py-3 font-bold text-ink-900 dark:border-ink-700 dark:text-white">
                  {t.title}
                </h2>
                <ul>
                  {t.items.map((it) => (
                    <Accordion key={it.q} item={it} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-ink-200 bg-ink-100 py-10 dark:border-ink-700 dark:bg-ink-800">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-2 text-2xl font-extrabold text-ink-900 dark:text-white">
            Cavabını tapmadınız?
          </h2>
          <p className="mb-6 text-ink-600 dark:text-ink-300">
            Sualınızı e-poçtla göndərin — mümkün qədər tez cavablandıracağıq.
          </p>

          {/* Telefon və «onlayn dəstək» düyməsi ÇIXARILDI: nömrə doldurulmamış
              şablon (+994 50 000 00 00) idi və çat düyməsi heç nə açmırdı.
              İşləməyən əlaqə kanalı, ümumiyyətlə göstərilməyəndən pisdir. */}
          <a
            href="mailto:destek@360tap.az"
            className="card mx-auto flex max-w-xs flex-col items-center gap-2 p-5 hover:border-tap"
          >
            <Mail className="h-6 w-6 text-tap" aria-hidden="true" />
            <span className="font-semibold">E-poçt yazın</span>
            <span className="text-xs text-ink-500 dark:text-ink-400">destek@360tap.az</span>
          </a>
        </div>
      </section>
    </div>
  );
}
