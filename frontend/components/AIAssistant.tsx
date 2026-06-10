'use client';
import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/lib/toast';

const TITLE_TEMPLATES: Record<string, (k: string) => string[]> = {
  telefon: (k) => [
    `${k} — yenidir, qutusu var, zəmanət`,
    `${k} ideal vəziyyətdə, sənədli`,
    `${k} 256GB, originaldır`,
    `${k} təcili satılır, az işlənmiş`,
  ],
  avtomobil: (k) => [
    `${k} — 1-ci sahibi, salondan alınıb`,
    `${k} əla vəziyyətdə, tam servis tarixçəsi`,
    `${k} az yürüşlü, ideal sürücü avtosu`,
  ],
  default: (k) => [
    `${k} — əla vəziyyətdə, təcili satılır`,
    `${k} yenidir, qutusunda`,
    `${k} az işlənmiş, ideal vəziyyət`,
    `${k} ən aşağı qiymətə`,
  ],
};

const DESC_TEMPLATES: Record<string, (k: string) => string> = {
  telefon: (k) => `${k}.\n\n• Vəziyyət: yeni / az işlənmiş\n• Qutusu və bütün aksesuarları daxildir\n• Zəmanət aktiv, sənədli\n• Qulaqcıq, kabel, adapter daxildir\n• Heç bir cızıq və qüsur yoxdur\n\nÇatdırılma və zəng üçün əlaqə saxlayın. Bakı daxili pulsuz çatdırılma.`,
  avtomobil: (k) => `${k}.\n\n• Birinci sahibi\n• Tam servis tarixçəsi (rəsmi sənədlər)\n• Heç bir DTP olmayıb\n• Saatla yoxlanışından keçib\n• Yağ, filterler dəyişdirilib\n• Garaj saxlanılıb\n\nDəyişməyə də baxılır. Bakıda yerləşir, kreditə də verilir.`,
  default: (k) => `${k}.\n\n• Vəziyyət: əla\n• Az istifadə olunub\n• Heç bir nasazlıq yoxdur\n• Real qiymət\n• Sənədli\n\nƏlaqə saxlayın, sual versəniz cavablandıraram. Razılaşma yolu ilə də danışmaq olar.`,
};

const PRICE_HINTS: Record<string, string> = {
  telefon: 'Telefon orta bazar qiyməti: 500–2500 ₼',
  avtomobil: 'Avtomobil orta qiymət aralığı: 8 000 – 80 000 ₼',
  'menzil-satilir': 'Mənzil m² qiymət: 800 – 3000 ₼',
  default: 'Bənzər elanları yoxlayıb real qiymət təyin edin',
};

export default function AIAssistant({
  keyword,
  category,
  onPickTitle,
  onPickDescription,
  onPriceHint,
}: {
  keyword?: string;
  category?: string;
  onPickTitle?: (t: string) => void;
  onPickDescription?: (d: string) => void;
  onPriceHint?: (msg: string) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [desc, setDesc] = useState('');

  const generate = async () => {
    if (!keyword || keyword.length < 3) {
      toast.warning('Əvvəlcə əsas açar söz yazın (məs: iPhone 15)');
      return;
    }
    setLoading(true);
    setOpen(true);

    // Mock AI — gələcəkdə Anthropic Claude API
    await new Promise((r) => setTimeout(r, 600));

    const cat = category || 'default';
    const titlesFn = TITLE_TEMPLATES[cat] || TITLE_TEMPLATES.default;
    const descFn = DESC_TEMPLATES[cat] || DESC_TEMPLATES.default;
    const priceHint = PRICE_HINTS[cat] || PRICE_HINTS.default;

    setTitles(titlesFn(keyword));
    setDesc(descFn(keyword));
    onPriceHint?.(priceHint);
    setLoading(false);
  };

  const useThisTitle = (t: string) => {
    onPickTitle?.(t);
    toast.success('Başlıq tətbiq edildi');
  };

  const useThisDesc = () => {
    onPickDescription?.(desc);
    toast.success('Təsvir tətbiq edildi');
  };

  return (
    <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-amber-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          AI elan köməkçisi
        </h4>
        <button onClick={generate} disabled={loading} className="btn-tap text-xs disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {open ? 'Yenilə' : 'Yarat'}
        </button>
      </div>
      <p className="text-xs text-amber-800">
        Açar sözə görə cəlbedici başlıq və ətraflı təsvir generasiya edir
      </p>

      {open && titles.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-semibold text-ink-700">Başlıq variantları:</div>
          {titles.map((t, i) => (
            <button
              key={i}
              onClick={() => useThisTitle(t)}
              className="w-full text-left p-2 rounded bg-white hover:bg-amber-100 border border-amber-200 text-sm group"
            >
              <Check className="w-3 h-3 inline mr-1.5 opacity-0 group-hover:opacity-100 text-emerald-500" />
              {t}
            </button>
          ))}

          {desc && (
            <>
              <div className="text-xs font-semibold text-ink-700 mt-3">Təsvir variantı:</div>
              <div className="p-2 rounded bg-white border border-amber-200 text-xs whitespace-pre-wrap text-ink-700 max-h-32 overflow-y-auto">
                {desc}
              </div>
              <button onClick={useThisDesc} className="btn-secondary text-xs">
                <Check className="w-3.5 h-3.5" /> Təsviri istifadə et
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
