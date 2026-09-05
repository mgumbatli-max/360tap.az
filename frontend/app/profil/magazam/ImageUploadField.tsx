'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadWithAuth } from '@/lib/api';
import { useToast } from '@/lib/toast';

/**
 * Loqo/örtük yükləyicisi.
 *
 * NİYƏ `uploadWithAuth`: xam `fetch` tokeni birbaşa localStorage-dan oxuyur və
 * `lib/api.ts`-dəki 401→refresh qatını tam bypass edir — access token 15 dəqiqədən
 * sonra bitdiyi üçün yükləmə səssizcə uğursuz olurdu (layihədə eyni səhv 4 yerdə
 * baş vermişdi). Bu köməkçi eyni refresh məntiqini FormData üçün təkrar işlədir.
 */
export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  aspect,
  disabled,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect: 'square' | 'cover';
  disabled?: boolean;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Yalnız JPEG, PNG və ya WebP şəkil qəbul olunur');
      return;
    }
    // Backend limiti 8MB-dır; istifadəçini serverə getməmiş xəbərdar edirik.
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Şəkil 8MB-dan böyük olmamalıdır');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadWithAuth<{ data?: { url: string }; url?: string }>(
        '/media/upload',
        fd,
      );
      const url = res.data?.url ?? res.url;
      if (!url) throw new Error('Şəkil ünvanı alınmadı');
      onChange(url);
      toast.success(`${label} yükləndi`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Yükləmə alınmadı');
    } finally {
      setBusy(false);
    }
  };

  const box =
    aspect === 'square'
      ? 'w-24 h-24 rounded-xl'
      : 'w-full h-28 sm:h-32 rounded-xl';

  return (
    <div>
      <div className="text-sm font-semibold text-ink-900 dark:text-white">{label}</div>
      <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 mb-2">{hint}</p>

      <div className="flex items-center gap-3">
        <div
          className={`${box} overflow-hidden bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 flex items-center justify-center shrink-0`}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-ink-300 dark:text-ink-500" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || disabled}
            aria-label={`${label} yüklə`}
            className="btn-secondary text-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {value ? 'Dəyiş' : 'Yüklə'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={busy || disabled}
              aria-label={`${label} sil`}
              className="btn-secondary text-sm inline-flex items-center gap-2 text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-tap disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Eyni faylı təkrar seçmək mümkün olsun deyə input sıfırlanır.
          e.target.value = '';
          if (f) void pick(f);
        }}
      />
    </div>
  );
}
