'use client';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function RulesChecker({ title, description, hasPhotos }: { title: string; description: string; hasPhotos: boolean }) {
  const rules = [
    { ok: title.length >= 10, label: 'Başlıq ən azı 10 simvol', tip: 'Başlığı genişləndirin' },
    { ok: title.length <= 100, label: 'Başlıq 100 simvoldan az', tip: 'Başlığı qısaldın' },
    { ok: description.length >= 50, label: 'Təsvir ən azı 50 simvol', tip: 'Daha ətraflı yazın' },
    { ok: hasPhotos, label: 'Ən azı 1 şəkil əlavə edilib', tip: 'Şəkil yükləyin' },
    { ok: !/\d{9,}/.test(title), label: 'Başlıqda telefon nömrəsi yoxdur', tip: 'Telefonu Əlaqə sahəsinə yazın' },
    { ok: !/http/i.test(description), label: 'Təsvirdə xarici link yoxdur', tip: 'Linkləri çıxarın' },
    { ok: !/!{3,}|\?{3,}/.test(title), label: 'Çoxlu !!! və ??? yoxdur', tip: 'Spam əlamətlərini silin' },
    { ok: title === title.charAt(0).toUpperCase() + title.slice(1), label: 'Düzgün başlıq formatlanması', tip: '' },
  ];
  const passed = rules.filter((r) => r.ok).length;
  const failed = rules.length - passed;
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm">Qaydalara uyğunluq</h4>
        <span className={`text-xs font-bold ${passed === rules.length ? 'text-emerald-600' : failed > 2 ? 'text-red-600' : 'text-amber-600'}`}>
          {passed}/{rules.length} ✓
        </span>
      </div>
      <ul className="text-xs space-y-1">
        {rules.map((r, i) => (
          <li key={i} className={`flex items-start gap-1.5 ${r.ok ? 'text-ink-700' : 'text-amber-600'}`}>
            {r.ok ? <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />}
            <span>{r.label}{!r.ok && r.tip && <span className="block text-[10px] text-ink-400">{r.tip}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
