'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink-900 mb-2">Bizimlə əlaqə</h1>
      <p className="text-ink-500 mb-8">Sualınız varsa — yazın, 24 saat ərzində cavab verəcəyik.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Forma */}
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Mesajınız göndərildi!</h2>
              <p className="text-ink-500">24 saat ərzində email vasitəsilə cavab verəcəyik.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Bizə yazın</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">Ad</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Mövzu</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" required>
                  <option value="">— Seçin —</option>
                  <option>Saytda problemim var</option>
                  <option>Elanım haqqında</option>
                  <option>Ödəniş problemi</option>
                  <option>Hesab problemi</option>
                  <option>Reklam əməkdaşlığı</option>
                  <option>Digər</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Mesaj</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6} className="input resize-y" required
                  placeholder="Detallı yazın..."
                />
              </div>
              <button type="submit" className="btn-tap"><Send className="w-4 h-4" /> Göndər</button>
            </form>
          )}
        </div>

        {/* Kontakt info */}
        <aside className="space-y-3">
          <div className="card p-5">
            <h3 className="font-bold text-ink-900 mb-3">Əlaqə kanalları</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-tap mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Email</div>
                  <a href="mailto:dest@360tap.az" className="text-tap hover:underline">dest@360tap.az</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-tap mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Dəstək telefon</div>
                  <a href="tel:+994500000000" className="text-tap hover:underline">+994 50 000 00 00</a>
                  <p className="text-xs text-ink-500 mt-0.5">9:00 - 21:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-tap mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Ofis</div>
                  <p className="text-ink-700">Bakı, Yasamal, Şərifzadə 1</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card p-5 bg-tap-50 border-tap-200">
            <h4 className="font-bold mb-1">Reklam əməkdaşlığı?</h4>
            <p className="text-sm text-ink-600 mb-2">Korporativ təkliflər üçün ayrı kanal:</p>
            <a href="mailto:reklam@360tap.az" className="text-tap font-semibold hover:underline text-sm">reklam@360tap.az</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
