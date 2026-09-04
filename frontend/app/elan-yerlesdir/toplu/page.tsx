'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getToken } from '@/lib/api';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function BulkUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const downloadTemplate = async () => {
    const token = getToken();
    const res = await fetch('/api/import/template', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      // Faza 0 (§10): /api/import/* NestJS-ə köçürülməyib (yalnız legacy Express-də idi).
      // İstifadəçi səssiz uğursuzluq yox, səbəbi görür.
      setError(
        res.status === 404
          ? 'Toplu yükləmə hazırda əlçatan deyil (funksiya köçürülmə mərhələsindədir).'
          : 'Şablon yüklənmədi',
      );
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '360tap-import-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  const submit = async (dryRun: boolean) => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getToken();
      const res = await fetch(`/api/import/listings${dryRun ? '?dry_run=true' : ''}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Xəta baş verdi');
        return;
      }
      if (dryRun) setPreview(d);
      else setResult(d);
    } catch (err: any) {
      setError(err.message || 'Şəbəkə xətası');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !user) return <div className="p-12 text-center text-ink-500">Yüklənir...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-3">
        <Link href="/" className="hover:text-tap">Ana</Link>
        <span>/</span>
        <Link href="/elan-yerlesdir" className="hover:text-tap">Elan yerləşdir</Link>
        <span>/</span>
        <span className="text-ink-900 font-medium">Toplu yükləmə</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-2">Excel ilə toplu yükləmə</h1>
      <p className="text-ink-500 mb-6">.xlsx və ya .csv faylı yükləyin — yüzlərlə elanı bir kliklə dərc edin.</p>

      {/* 1: Şablonu yüklə */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-tap-50 text-tap flex items-center justify-center font-bold shrink-0">1</div>
          <div className="flex-1">
            <h2 className="font-bold text-ink-900">Şablonu yüklə</h2>
            <p className="text-sm text-ink-600 mt-1">
              Hazır Excel şablonunu yükləyin və öz məlumatlarınızı doldurun.
              Tələb olunan sütunlar: <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded">title, description, category</code>.
            </p>
            <button onClick={downloadTemplate} className="btn-secondary text-sm mt-3">
              <Download className="w-4 h-4" /> Şablonu endir (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* 2: Faylı yüklə */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-tap-50 text-tap flex items-center justify-center font-bold shrink-0">2</div>
          <div className="flex-1">
            <h2 className="font-bold text-ink-900">Faylı yüklə</h2>
            <p className="text-sm text-ink-600 mt-1">.xlsx, .xls və ya .csv (maksimum 20 MB).</p>

            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`mt-3 border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                file ? 'border-tap bg-tap-50/50' : 'border-ink-300 hover:border-tap'
              }`}
              onClick={() => inputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-tap" />
                  <div className="text-left">
                    <div className="font-semibold">{file.name}</div>
                    <div className="text-xs text-ink-500">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPickFile(null); }}
                    className="text-xs text-red-500 hover:underline ml-3"
                  >
                    Sil
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-2 text-ink-400" />
                  <p className="text-sm text-ink-700">
                    Faylı bura sürükləyin və ya <span className="text-tap font-semibold">seçin</span>
                  </p>
                  <p className="text-xs text-ink-400 mt-1">.xlsx · .xls · .csv</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3: Yoxla və yüklə */}
      {file && (
        <div className="card p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-tap-50 text-tap flex items-center justify-center font-bold shrink-0">3</div>
            <div className="flex-1">
              <h2 className="font-bold text-ink-900">Yoxla və ya birbaşa yüklə</h2>
              <p className="text-sm text-ink-600 mt-1">
                &quot;Yoxla&quot; — sadəcə validasiya edir, heç nə dərc etmir. &quot;Yüklə&quot; — bütün düzgün sətirləri elan kimi yaradır.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => submit(true)} disabled={uploading} className="btn-secondary disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Yoxla (dry-run)
                </button>
                <button onClick={() => submit(false)} disabled={uploading} className="btn-tap disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Yüklə və dərc et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* PREVIEW */}
      {preview && (
        <div className="card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-tap" /> Yoxlama nəticəsi
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
              <div className="text-2xl font-extrabold">{preview.valid_count}</div>
              <div className="text-xs">Düzgün sətir</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-red-700">
              <div className="text-2xl font-extrabold">{preview.error_count}</div>
              <div className="text-xs">Xətalı sətir</div>
            </div>
          </div>

          {preview.errors?.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold mb-2 text-sm">Xətalar (ilk 50):</h4>
              <div className="card p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50">
                    <tr><th className="text-left p-2">Sətir</th><th className="text-left p-2">Sahə</th><th className="text-left p-2">Səbəb</th></tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((e: any, i: number) => (
                      <tr key={i} className="border-t border-ink-100">
                        <td className="p-2">{e.row}</td>
                        <td className="p-2 font-mono text-xs">{e.field}</td>
                        <td className="p-2 text-red-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.sample?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm">Nümunə (ilk 3 düzgün sətir):</h4>
              <pre className="bg-ink-50 p-3 rounded text-xs overflow-x-auto">{JSON.stringify(preview.sample, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS */}
      {result && (
        <div className="card p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <h3 className="font-bold text-emerald-900">Tamamlandı!</h3>
              <p className="text-sm text-emerald-700">
                {result.inserted} elan uğurla dərc edildi
                {result.error_count > 0 && `, ${result.error_count} sətirdə xəta var`}.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profil/elanlarim" className="btn-tap text-sm">Mənim elanlarıma bax →</Link>
            <Link href="/elanlar" className="btn-secondary text-sm">Saytda gör</Link>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-8 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="card p-4">
          <h4 className="font-bold mb-2">Hansı kateqoriya slug-ları?</h4>
          <p className="text-ink-600 text-xs">
            telefon, avtomobil, menzil-satilir, menzil-kiraye, is-elanlari, xidmetler və s.
            Bütün slug-ları <Link href="/api/categories" className="text-tap underline">/api/categories</Link>-də görə bilərsiniz.
          </p>
        </div>
        <div className="card p-4">
          <h4 className="font-bold mb-2">Atributlar necə yazılır?</h4>
          <p className="text-ink-600 text-xs">
            Sütun adı <code className="bg-ink-100 px-1 rounded">attr_brand</code>, <code className="bg-ink-100 px-1 rounded">attr_year</code> kimi.
            Avto üçün attr_brand, attr_model, attr_year. Mənzil üçün attr_rooms, attr_area.
          </p>
        </div>
      </div>
    </div>
  );
}
