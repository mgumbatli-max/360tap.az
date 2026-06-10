'use client';
import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function AvatarUploader({
  currentUrl,
  fullName,
  onUpdate,
  size = 'lg',
}: {
  currentUrl?: string | null;
  fullName: string;
  onUpdate?: (url: string) => void;
  size?: 'md' | 'lg';
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dim = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const text = size === 'lg' ? 'text-3xl' : 'text-xl';

  const onPick = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil ola bilər');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Şəkil 5MB-dan böyük olmamalıdır');
      return;
    }
    setUploading(true);
    try {
      // 1) Yüklə
      const fd = new FormData();
      fd.append('files', file);
      const token = localStorage.getItem('avito_token');
      const res = await fetch('/api/upload/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Yükləmə uğursuz');
      const url = d.urls?.[0];
      if (!url) throw new Error('URL alınmadı');

      // 2) Profilə tətbiq et
      await api('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: url }),
      });

      setPreviewUrl(url);
      onUpdate?.(url);
      toast.success('Avatar yeniləndi');
    } catch (err: any) {
      toast.error(err.message || 'Xəta baş verdi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block group">
      <div className={`${dim} rounded-full overflow-hidden bg-tap-50 text-tap flex items-center justify-center font-extrabold ${text}`}>
        {previewUrl ? (
          <img src={previewUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span>{fullName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-tap text-white flex items-center justify-center shadow-lg hover:scale-110 transition disabled:opacity-50"
        aria-label="Şəkil dəyişdir"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
    </div>
  );
}
