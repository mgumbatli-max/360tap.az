export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink-900 mb-2">Məxfilik siyasəti</h1>
      <p className="text-ink-500 mb-8">Yenilənib: 8 May 2026</p>

      <Section title="1. Hansı məlumatları toplayırıq">
        <ul>
          <li>Qeydiyyat zamanı: ad, email, telefon, şəhər</li>
          <li>İstifadə zamanı: cihaz, IP ünvan, brauzer növü</li>
          <li>Elanlarınız: başlıq, təsvir, şəkil, qiymət</li>
          <li>Ödəniş tarixçəsi (provayder vasitəsilə)</li>
        </ul>
      </Section>

      <Section title="2. Məlumatları nə üçün istifadə edirik">
        <ul>
          <li>Xidmətin təminatı və saxlanması</li>
          <li>Hesabın təsdiqi və təhlükəsizliyi</li>
          <li>Bildirişlərin göndərilməsi (yalnız sizin razılıqla)</li>
          <li>Statistik təhlil və xidmətin yaxşılaşdırılması</li>
          <li>Qanun tələbləri ilə əməl etmək</li>
        </ul>
      </Section>

      <Section title="3. Şəxsi məlumatların qorunması">
        <p>
          Bütün məlumatlar şifrələnmiş şəkildə saxlanır. Parollar argon2id alqoritmi ilə hash edilir.
          Sayt PCI DSS, OWASP və Azərbaycan KMQ tələblərinə uyğundur.
        </p>
      </Section>

      <Section title="4. Cookie-lər">
        <p>
          Sayt sessiya idarəsi, statistik analitika və reklam üçün cookie istifadə edir. Brauzerinizdə
          cookie-ləri söndürə bilərsiniz, lakin bu, saytın funksionallığına təsir edə bilər.
        </p>
      </Section>

      <Section title="5. Məlumatlarınızı 3-cü tərəflərlə paylaşmırıq">
        <p>
          Yalnız aşağıdakı hallar istisnadır:
        </p>
        <ul>
          <li>Ödəniş provayderləri (Pulpal, Epoint)</li>
          <li>Logistika provayderləri (sifariş zamanı)</li>
          <li>Qanun məcburiyyəti</li>
        </ul>
      </Section>

      <Section title="6. Sizin hüquqlarınız">
        <ul>
          <li>Şəxsi məlumatlarınızı görmək</li>
          <li>Düzəlişlər tələb etmək</li>
          <li>Hesabı silmək (məlumatlar 30 gün ərzində silinir)</li>
          <li>Bildirişlərin abunəliyini ləğv etmək</li>
          <li>Məlumatları ixrac etmək (DSAR)</li>
        </ul>
      </Section>

      <Section title="7. Saxlanma müddəti">
        <p>
          Hesab fəal olduğu müddətcə məlumatlar saxlanır. Hesab silindikdən sonra 30 gün ərzində
          tam silinir. Audit log və qanun tələb etdiyi məlumatlar 1 ilədək saxlanır.
        </p>
      </Section>

      <Section title="8. Əlaqə">
        <p>Suallar üçün: <a href="mailto:privacy@360tap.az" className="text-tap">privacy@360tap.az</a></p>
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
