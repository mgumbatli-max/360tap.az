'use client';
import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, Loader2, ImagePlus, Clipboard, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/lib/toast';
import { formatPrice } from '@/lib/api';

type Result = {
  uploaded: { url: string; fullUrl: string; filename: string; size: number };
  analysis: { category: string | null; brand: string | null; color: string; confidence: number; labels: string[] };
  similar: any[];
  total: number;
};

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ImageSearchClient() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Yalnız şəkil yüklə bilərsiniz'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Maksimum 10 MB'); return; }

    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append('image', file);

    try {
      const r = await fetch(`${API}/image-search`, { method: 'POST', body: form });
      if (!r.ok) throw new Error('Server xətası');
      const data: Result = await r.json();
      setResult(data);
      toast.success(`AI tanıdı: ${data.analysis.labels.join(', ')}`);
    } catch (e: any) {
      toast.error('Şəkil yoxlanılarkən xəta baş verdi');
    } finally { setLoading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const onPaste = useCallback((e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData?.files || [])[0];
    if (file) upload(file);
  }, []);

  // Paste listener
  if (typeof window !== 'undefined') {
    window.addEventListener('paste', onPaste as any, { once: false });
  }

  const reset = () => { setPreview(null); setResult(null); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-ink-500 mb-3">
        <Link href="/" className="hover:text-tap">Ana</Link> / <span className="font-medium">Şəkil ilə axtarış</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-2">
          <Camera className="w-8 h-8 text-tap" /> Şəkillə axtar
          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-violet-500 to-tap text-white rounded-full">AI</span>
        </h1>
        <p className="text-ink-600">Şəkil yükləyin, çəkin və ya kopyalayıb yapışdırın — AI sizin üçün oxşar elanları tapacaq</p>
      </div>

      {!preview && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition ${
              dragging ? 'border-tap bg-tap-50 scale-[1.01]' : 'border-ink-300 bg-ink-50/50'
            }`}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-tap to-violet-500 text-white flex items-center justify-center">
              <ImagePlus className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Şəkili buraya sürükləyin</h2>
            <p className="text-ink-600 mb-6">PNG, JPG, WEBP — maksimum 10 MB</p>

            <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <button onClick={() => fileRef.current?.click()} className="card p-4 hover:border-tap group">
                <Upload className="w-8 h-8 mx-auto text-tap mb-2 group-hover:scale-110 transition" />
                <div className="font-bold">Fayl seç</div>
                <div className="text-xs text-ink-500 mt-1">Kompüterdən</div>
              </button>
              <button onClick={() => cameraRef.current?.click()} className="card p-4 hover:border-tap group">
                <Camera className="w-8 h-8 mx-auto text-emerald-500 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold">Kamera</div>
                <div className="text-xs text-ink-500 mt-1">Şəkil çək</div>
              </button>
              <div className="card p-4 bg-amber-50 border-amber-200">
                <Clipboard className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                <div className="font-bold">Yapışdır</div>
                <div className="text-xs text-ink-500 mt-1">Cmd+V / Ctrl+V</div>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="hidden" />
          </div>

          {/* How it works */}
          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <Step n={1} icon={Upload} title="Şəkil yüklə" text="Drag-drop, fayl seç və ya çək" />
            <Step n={2} icon={Sparkles} title="AI tanı" text="Marka, model, rəng, kateqoriya" />
            <Step n={3} icon={Tag} title="Nəticələrə bax" text="Oxşar elanlar siyahısı" />
          </div>
        </>
      )}

      {preview && (
        <div className="grid lg:grid-cols-[400px_1fr] gap-5">
          {/* Sol: yüklənmiş şəkil + AI analiz */}
          <aside className="space-y-4">
            <div className="card p-3 relative">
              <img src={preview} alt="Yüklədiyiniz" className="w-full aspect-square object-cover rounded-xl" />
              <button onClick={reset} className="absolute top-5 right-5 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading && (
              <div className="card p-5 bg-gradient-to-br from-tap-50 to-violet-50 text-center">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-tap mb-2" />
                <div className="font-bold">AI şəkili analiz edir...</div>
                <p className="text-xs text-ink-500 mt-1">Marka, model, rəng tanınır</p>
              </div>
            )}

            {result && (
              <>
                <div className="card p-4 bg-gradient-to-br from-tap-50 to-violet-50 border-tap/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-tap" />
                    <h3 className="font-bold">AI analiz nəticəsi</h3>
                    <span className="ml-auto text-xs font-bold text-emerald-600">{result.analysis.confidence}%</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {result.analysis.category && <Row label="Kateqoriya" value={result.analysis.category} highlight />}
                    {result.analysis.brand && <Row label="Marka" value={result.analysis.brand} />}
                    {result.analysis.color && <Row label="Rəng" value={result.analysis.color} />}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.analysis.labels.map((l) => (
                      <span key={l} className="px-2 py-0.5 rounded-full bg-tap text-white text-xs font-bold">{l}</span>
                    ))}
                  </div>
                </div>

                <button onClick={reset} className="btn-secondary w-full">
                  <Camera className="w-4 h-4" /> Yeni şəkil yüklə
                </button>
              </>
            )}
          </aside>

          {/* Sağ: nəticələr */}
          <main>
            {!loading && result && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-tap" /> Oxşar elanlar
                    {result.total > 0 && <span className="text-ink-500 font-normal text-base">({result.total})</span>}
                  </h2>
                  {result.analysis.category && (
                    <Link href={`/elanlar?category=${result.analysis.category}`} className="text-sm text-tap hover:underline flex items-center gap-1">
                      Bütün kateqoriyaya bax <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {result.similar.length === 0 ? (
                  <div className="card p-12 text-center">
                    <ImagePlus className="w-16 h-16 mx-auto text-ink-300 mb-3" />
                    <h3 className="font-bold mb-2">Tam uyğun elan tapılmadı</h3>
                    <p className="text-sm text-ink-500 mb-4">
                      AI sizin şəkildə "{result.analysis.labels.join(', ')}" tanıdı, lakin DB-də uyğun aktiv elan yoxdur.
                    </p>
                    <Link href="/elan-yerlesdir" className="btn-tap inline-flex">+ İlk olub elan yerləşdir</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {result.similar.map((s) => (
                      <Link key={s.id} href={`/elanlar/${s.id}`} className="card p-2 group hover:-translate-y-0.5 transition">
                        <div className="aspect-square bg-ink-100 rounded-xl overflow-hidden mb-2 relative">
                          {s.cover?.url && <img src={s.cover.url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-tap/90 text-white text-[10px] font-bold rounded backdrop-blur">AI seçim</span>
                        </div>
                        <div className="font-bold text-base">{formatPrice(s.price, s.currency)}</div>
                        <div className="text-xs text-ink-600 line-clamp-2 mt-0.5">{s.title}</div>
                        {s.city_name && <div className="text-[10px] text-ink-500 mt-1">📍 {s.city_name}</div>}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function Step({ n, icon: I, title, text }: any) {
  return (
    <div className="card p-4 text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-tap text-white flex items-center justify-center font-bold mb-2">{n}</div>
      <I className="w-5 h-5 mx-auto text-tap mb-1" />
      <div className="font-bold text-sm">{title}</div>
      <div className="text-xs text-ink-500 mt-1">{text}</div>
    </div>
  );
}

function Row({ label, value, highlight }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`font-bold ${highlight ? 'text-tap' : ''}`}>{value}</span>
    </div>
  );
}
