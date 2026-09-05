'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitCompareArrows, X } from 'lucide-react';
import { getCompare, removeCompare, clearCompare, type CompareItem } from '@/lib/compare';
import { azNumber } from '@/lib/format';

export default function CompareBar() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const update = () => setItems(getCompare());
    update();
    window.addEventListener('compare-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('compare-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30 md:bottom-8 md:right-8">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-xl p-3 flex items-center gap-3">
          <div className="flex -space-x-2">
            {items.slice(0, 3).map((it) => (
              <div key={it.id} className="w-10 h-10 rounded-lg bg-ink-100 border-2 border-white overflow-hidden">
                {it.cover && <img src={it.cover} className="w-full h-full object-cover" alt="" />}
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-ink-500">Müqayisə</div>
            <div className="font-bold text-sm">{items.length} elan</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-tap text-sm py-2"
          >
            <GitCompareArrows className="w-4 h-4" />
            Müqayisə et
          </button>
          <button
            onClick={clearCompare}
            className="text-ink-400 hover:text-red-500 p-1"
            aria-label="Təmizlə"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showModal && <CompareModal items={items} onClose={() => setShowModal(false)} />}
    </>
  );
}

function CompareModal({ items, onClose }: { items: CompareItem[]; onClose: () => void }) {
  // Bütün attribute key-ləri toplayırıq
  const allKeys = new Set<string>();
  items.forEach((it) => {
    if (it.attributes) Object.keys(it.attributes).forEach((k) => allKeys.add(k));
  });
  const keys = Array.from(allKeys);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-tap" />
            Elanların müqayisəsi
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-semibold text-ink-500 sticky left-0 bg-white"></th>
                {items.map((it) => (
                  <th key={it.id} className="p-2 min-w-[200px]">
                    <div className="card p-3">
                      <div className="aspect-square rounded-lg bg-ink-100 overflow-hidden mb-2">
                        {it.cover && <img src={it.cover} alt={it.title} className="w-full h-full object-cover" />}
                      </div>
                      <Link href={`/elanlar/${it.id}`} onClick={onClose} className="font-bold text-ink-900 hover:text-tap text-sm line-clamp-2 text-left block">
                        {it.title}
                      </Link>
                      <button
                        onClick={() => removeCompare(it.id)}
                        className="text-xs text-red-500 hover:underline mt-1"
                      >
                        Sil
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Qiymət">
                {items.map((it) => (
                  <td key={it.id} className="p-2 font-bold text-ink-900">
                    {it.price ? `${azNumber(it.price)} ${it.currency}` : 'Razılaşma'}
                  </td>
                ))}
              </CompareRow>
              <CompareRow label="Kateqoriya">
                {items.map((it) => <td key={it.id} className="p-2 text-ink-700">{it.category ?? '—'}</td>)}
              </CompareRow>
              <CompareRow label="Şəhər">
                {items.map((it) => <td key={it.id} className="p-2 text-ink-700">{it.city ?? '—'}</td>)}
              </CompareRow>

              {keys.map((k) => (
                <CompareRow key={k} label={k.replace(/_/g, ' ')}>
                  {items.map((it) => (
                    <td key={it.id} className="p-2 text-ink-700 text-xs">
                      {it.attributes?.[k] != null ? String(it.attributes[k]) : '—'}
                    </td>
                  ))}
                </CompareRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-ink-100 hover:bg-ink-50">
      <td className="py-3 pr-4 font-semibold text-ink-500 sticky left-0 bg-white capitalize">{label}</td>
      {children}
    </tr>
  );
}
