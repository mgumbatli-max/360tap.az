'use client';
import { useState } from 'react';
import { Bookmark, BookmarkCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function SaveSearchButton({ filters }: { filters: Record<string, string> }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Filter aktivdirsə göstər
  const hasFilters = Object.entries(filters).some(([k, v]) =>
    v && k !== 'sort' && (k === 'q' || k.startsWith('attr_') || ['category', 'city', 'min_price', 'max_price', 'condition'].includes(k))
  );

  if (!hasFilters) return null;

  const onSave = async () => {
    if (!user) {
      toast.warning('Saxlamaq üçün daxil olmalısınız');
      return;
    }
    if (!name.trim()) {
      toast.error('Ad daxil edin');
      return;
    }
    setSaving(true);
    try {
      // NestJS DTO: query = bütün filtrlər (obyekt), notify (boolean)
      const query: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) query[k] = v;
      });
      await api('/saved-searches', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), query, notify: true }),
      });
      toast.success('Axtarış saxlanıldı! Yeni elan gələndə xəbər tutacaqsınız.');
      setSaved(true);
      setOpen(false);
      setName('');
    } catch (err: any) {
      toast.error(err.message || 'Saxlama uğursuz oldu');
    } finally {
      setSaving(false);
    }
  };

  // Default ad təklif
  const defaultName = (() => {
    const parts: string[] = [];
    if (filters.q) parts.push(`"${filters.q}"`);
    if (filters.category) parts.push(filters.category);
    if (filters.city) parts.push(filters.city);
    if (filters.min_price || filters.max_price) {
      parts.push(`${filters.min_price || '0'}–${filters.max_price || '∞'} ₼`);
    }
    return parts.slice(0, 3).join(' · ') || 'Yeni axtarış';
  })();

  return (
    <>
      <button
        onClick={() => { setName(defaultName); setOpen(true); }}
        className={`btn-secondary text-sm ${saved ? '!text-emerald-600 !border-emerald-200' : ''}`}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        {saved ? 'Saxlandı' : 'Axtarışı saxla'}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-5 h-5 text-tap" />
              <h2 className="text-xl font-bold">Axtarışı saxla</h2>
            </div>
            <p className="text-sm text-ink-500 mb-4">
              Yeni uyğun elan gələndə email ilə xəbər tutacaqsınız.
            </p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Axtarışa ad verin"
              autoFocus
              maxLength={120}
            />

            <div className="mt-4 p-3 rounded-lg bg-ink-50 text-xs text-ink-600 space-y-1">
              <p className="font-semibold mb-1">Saxlanılacaq filtrlər:</p>
              {Object.entries(filters).map(([k, v]) => (
                v && k !== 'sort' ? (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ) : null
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Ləğv et
              </button>
              <button onClick={onSave} disabled={saving} className="btn-tap flex-1 disabled:opacity-50">
                {saving ? 'Saxlanılır...' : 'Saxla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
