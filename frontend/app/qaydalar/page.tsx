export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 prose prose-sm">
      <h1 className="text-3xl font-extrabold text-ink-900 mb-2">İstifadə qaydaları</h1>
      <p className="text-ink-500 mb-8">Yenilənib: 8 May 2026</p>

      <Section title="1. Ümumi müddəalar">
        <p>
          360tap.az saytı (bundan sonra "Sayt") fiziki və hüquqi şəxslərin elan yerləşdirməsi və axtarması
          üçün universal platformadır. Sayta daxil olmaqla siz bu qaydaları qəbul etmiş sayılırsınız.
        </p>
      </Section>

      <Section title="2. Qeydiyyat və hesab">
        <ul>
          <li>Qeydiyyatdan keçmək üçün ən azı email və ya telefon nömrəsi tələb olunur.</li>
          <li>Hesab məlumatlarınızı təhlükəsiz saxlamaq sizin məsuliyyətinizdədir.</li>
          <li>Bir istifadəçi yalnız bir hesab yarada bilər.</li>
          <li>18 yaşından aşağı şəxslər valideyn icazəsi olmadan qeydiyyat ola bilməz.</li>
        </ul>
      </Section>

      <Section title="3. Elan yerləşdirmə qaydaları">
        <ul>
          <li>Elan yerləşdirmək pulsuzdur (kateqoriyaya görə limit var).</li>
          <li>Bütün elanlar moderasiyadan keçir.</li>
          <li>Doğru kateqoriya seçilməlidir.</li>
          <li>Şəkillər keyfiyyətli və məhsula uyğun olmalıdır.</li>
          <li>Saxta əlaqə məlumatları və ya başqasının şəklini istifadə etmək qadağandır.</li>
          <li>Eyni məhsul üçün təkrar elan yerləşdirmək qadağandır.</li>
        </ul>
      </Section>

      <Section title="4. Qadağan olunmuş kateqoriyalar">
        <ul>
          <li>Silah və silah aksesuarları (qanunvericiliyə zidd olanlar)</li>
          <li>Narkotik vasitələr</li>
          <li>Saxta sənədlər və əlamətlər</li>
          <li>İnsan orqanları</li>
          <li>Vəhşi heyvanlar (qoruq altındakı növlər)</li>
          <li>Saxta valyuta və qiymətli kağızlar</li>
          <li>Cinsi xidmətlər</li>
          <li>Şəxsi məlumatlar (verilənlər bazaları)</li>
        </ul>
      </Section>

      <Section title="5. Ödənişli xidmətlər">
        <p>
          Sayt VIP, Premium, Boost və digər ödənişli xidmətlər təklif edir. Ödəniş Pulpal və Epoint
          provayderləri vasitəsilə həyata keçirilir. Ödəniş geri qaytarılması yalnız texniki xəta
          olduqda mümkündür.
        </p>
      </Section>

      <Section title="6. Məsuliyyət məhdudiyyəti">
        <p>
          360tap.az platformadır və alıcı-satıcı arasında əməliyyatlara görə məsuliyyət daşımır.
          Saytda yerləşdirilmiş elanların doğruluğuna görə yalnız satıcı məsuliyyət daşıyır.
        </p>
      </Section>

      <Section title="7. Hesabın bloklanması">
        <p>
          Saxta elan, fırıldaqçılıq, təhqir, spam, bu qaydaların pozulması halında hesab müvəqqəti
          və ya daimi bloklana bilər. Bloklamadan əvvəl xəbərdarlıq edilə bilər.
        </p>
      </Section>

      <Section title="8. Şikayət sistemi">
        <p>
          Hər istifadəçi şübhəli elan, fırıldaqçı və ya qaydaları pozan istifadəçi haqqında şikayət edə bilər.
          Şikayətlər 24 saat ərzində baxılır.
        </p>
      </Section>

      <Section title="9. Dəyişikliklər">
        <p>
          Saytın inzibatiyyatı bu qaydaları istənilən vaxt dəyişdirmək hüququna malikdir. Dəyişikliklər
          dərc olunduğu andan qüvvəyə minir.
        </p>
      </Section>

      <Section title="10. Əlaqə">
        <p>
          Suallar və müraciətlər üçün: <a href="mailto:dest@360tap.az" className="text-tap">dest@360tap.az</a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-ink-900 mb-2">{title}</h2>
      <div className="text-ink-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
