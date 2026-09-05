'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProfileLayout from '@/components/ProfileLayout';
import { Bell, Globe, Eye, Moon, Sun, Monitor, Keyboard, Sliders, LayoutGrid, Rows3 } from 'lucide-react';
// SAXTA KOMPONENTLƏR SÖNDÜRÜLDÜ (bildiriş işi, 2026-09-06).
// Aşağıdakı komponentlər istifadəçiyə REAL VƏD verirdi, amma heç nə etmirdi:
// serverə bir sorğu belə atmır, yalnız `localStorage`-a yazır və ya sadəcə toast
// göstərirdilər. Yəni istifadəçi xəbərdarlıq qurub brauzerini bağlayır və heç vaxt
// heç nə almırdı — bu, işləməyən düymədən daha pisdir, çünki gözlənti yaradır.
// Fayllar SİLİNMƏDİ: real endpoint hazır olanda import və render bir sətirlə qaytarılır.
// PushSubscribe: abunəni serverə göndərmirdi. TelegramBotConnect: yalnız useState.
// EmailDigest: yalnız uğur toast-u — abunə heç yerdə saxlanılmırdı.
// import PushSubscribe from '@/components/PushSubscribe';
// import TelegramBotConnect from '@/components/TelegramBotConnect';
// import EmailDigest from '@/components/EmailDigest';
import AutoReplyBot from '@/components/AutoReplyBot';
import SellerVerification from '@/components/SellerVerification';

export default function SettingsPage() {
  const [theme, setTheme] = useState<string>('light');
  const [density, setDensity] = useState<string>('comfortable');
  const [lang, setLang] = useState<string>('az');
  const [currency, setCurrency] = useState<string>('AZN');
  // Sabitləşdirmə: notifEmail / notifPush / notifSms / savedSearchAlerts / phonePublic
  // state-ləri və onların açarları ÇIXARILDI. Onlar nə serverə, nə localStorage-a
  // yazılırdı — «Yadda saxla» yalnız uğur toast-u göstərirdi, səhifə yenilənən kimi
  // hər şey ilkin dəyərə qayıdırdı.
  // Niyə localStorage-a yazmaqla «düzəltmədim»: bu beş açarın hamısı SERVER tərəfli
  // davranışa aiddir (e-poçt/SMS göndərişi, saxlanılmış axtarış xəbərdarlığı, elan
  // cavabındakı telefonun maskalanması). Backend-də nə `PATCH /users/me`, nə
  // `PUT /me/settings` var; brauzerdə saxlamaq açarı İŞLƏK etmirdi, sadəcə istifadəçini
  // «e-poçt bildirişlərini söndürdüm» / «telefonum gizlidir» deyə yanıldırdı — yəni
  // yarımçıq tətbiq indiki vəziyyətdən daha pisdir.
  // Aşağıdakı Tema/Sıxlıq/Dil/Valyuta seçimləri QALIR: onların hər birinin real oxuyanı
  // var (app/layout.tsx, DensityToggle, lib/i18n, lib/currency) — yəni həqiqətən işləyir.

  useEffect(() => {
    try {
      setTheme(localStorage.getItem('avito_theme') || 'light');
      setDensity(localStorage.getItem('tap_density') || 'comfortable');
      setLang(localStorage.getItem('tap_lang') || 'az');
      setCurrency(localStorage.getItem('tap_currency') || 'AZN');
    } catch {}
  }, []);

  const saveTheme = (v: string) => { setTheme(v); localStorage.setItem('avito_theme', v); document.documentElement.classList.remove('light','dark'); document.documentElement.classList.add(v === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : v); };
  const saveDensity = (v: string) => { setDensity(v); localStorage.setItem('tap_density', v); document.documentElement.dataset.density = v; };

  return (
    <ProfileLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-6 h-6 text-tap" />
          <h1 className="text-2xl font-extrabold">Tənzimləmələr</h1>
        </div>

        {/* Görünüş */}
        <Section title="Görünüş" icon={Eye}>
          <Row label="Tema">
            <ToggleGroup value={theme} onChange={saveTheme} options={[
              { v: 'light', label: 'Aydın', icon: Sun },
              { v: 'dark', label: 'Tünd', icon: Moon },
              { v: 'system', label: 'Sistem', icon: Monitor },
            ]} />
          </Row>
          <Row label="Sıxlıq" hint="Kart sıxlığı">
            <ToggleGroup value={density} onChange={saveDensity} options={[
              { v: 'comfortable', label: 'Rahat', icon: LayoutGrid },
              { v: 'compact', label: 'Kompakt', icon: Rows3 },
            ]} />
          </Row>
        </Section>

        {/* Dil və regional */}
        <Section title="Dil və regional" icon={Globe}>
          <Row label="Dil">
            <select value={lang} onChange={(e) => { setLang(e.target.value); localStorage.setItem('tap_lang', e.target.value); }} className="input !w-auto !py-2">
              <option value="az">🇦🇿 Azərbaycanca</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </Row>
          <Row label="Valyuta">
            <select value={currency} onChange={(e) => { setCurrency(e.target.value); localStorage.setItem('tap_currency', e.target.value); }} className="input !w-auto !py-2">
              <option value="AZN">AZN ₼</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="RUB">RUB ₽</option>
            </select>
          </Row>
        </Section>

        {/* Bildirişlər — saytdaxili bildirişlər ARTIQ İŞLƏYİR (2026-09-06):
            saxlanmış axtarışa uyğun yeni elan, elanın müddətinin bitməsi və
            sevimlilərdəki elanın statusunun dəyişməsi. E-poçt/SMS kanalları hələ yoxdur,
            ona görə onların açarları da göstərilmir — işləməyən açar yalan vəddir. */}
        <Section title="Bildirişlər və məxfilik" icon={Bell}>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            Saytdaxili bildirişlər aktivdir: saxladığınız axtarışa uyğun yeni elan çıxanda,
            elanınızın müddəti bitməyə yaxınlaşanda və sevimlilərinizdəki elan satılanda
            xəbər alırsınız.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/profil/bildirisler" className="btn-secondary text-sm">
              Bildirişlərə bax
            </Link>
            <Link href="/profil/saxlanmis" className="btn-secondary text-sm">
              Saxlanmış axtarışları idarə et
            </Link>
          </div>
          <p className="text-xs text-ink-400 mt-3">
            E-poçt və SMS ilə bildiriş, həmçinin telefon görünürlüyü tənzimləməsi hazırlanır.
          </p>
        </Section>

        {/* İnteqrasiyalar — push, telegram, email, autoreply, verification */}
        <Section title="İnteqrasiyalar və avtomatlaşdırma" icon={Bell}>
          <div className="space-y-3">
            
            
            
            <AutoReplyBot />
            <SellerVerification />
          </div>
        </Section>

        {/* Klaviatura */}
        <Section title="Klaviatura qısayolları" icon={Keyboard}>
          <p className="text-sm text-ink-500 mb-3">Saytda istənilən yerdə <kbd className="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-xs font-mono">?</kbd> basın və bütün qısayolları görün</p>
          <ul className="text-sm space-y-1.5">
            <li><kbd className="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono text-xs">⌘ K</kbd> — Sürətli axtarış (Command palette)</li>
            <li><kbd className="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono text-xs">/</kbd> — Axtarış sahəsi</li>
            <li><kbd className="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded font-mono text-xs">G N</kbd> — Yeni elan</li>
          </ul>
        </Section>

        {/* «Yadda saxla» düyməsi ÇIXARILDI: heç nə saxlamırdı, yalnız uğur toast-u atırdı.
            Qalan seçimlər (tema/sıxlıq/dil/valyuta) onsuz da seçilən anda yazılır —
            ayrıca saxlama addımı yanlış təsəvvür yaradırdı. */}
        <p className="text-xs text-ink-500">
          Yuxarıdakı seçimlər dəyişdiyiniz anda avtomatik yadda saxlanılır.
        </p>
      </div>
    </ProfileLayout>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-4 text-lg">
        <Icon className="w-4 h-4 text-tap" /> {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-100 dark:border-ink-700 last:border-b-0">
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}


function ToggleGroup({ value, onChange, options }: any) {
  return (
    <div className="inline-flex bg-ink-100 dark:bg-ink-800 rounded-lg p-0.5">
      {options.map((o: any) => {
        const I = o.icon;
        return (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              value === o.v ? 'bg-white dark:bg-ink-700 text-tap shadow' : 'text-ink-600 dark:text-ink-300'
            }`}>
            <I className="w-3.5 h-3.5" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
