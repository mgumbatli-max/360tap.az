'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Search, X, Check } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

/**
 * KATEQORİYA SEÇİCİSİ — AĞACDA GƏZİNTİ + AXTARIŞ.
 *
 * ƏVVƏL: `flattenCats()` bütün ağacı düz siyahıya çevirirdi və 100-dən çox element
 * tək `<select>`-ə düşürdü; səviyyə yalnız «— » prefiksi ilə göstərilirdi. Nəticədə
 * istifadəçi «Tibb, əczaçılıq»ı tapmaq üçün onlarla sətir sürüşdürməli olurdu və
 * hansı elementin hansı kateqoriyaya aid olduğu görünmürdü.
 *
 * İNDİ iki üsul birlikdə işləyir:
 *   1. GƏZİNTİ — kök kateqoriya → alt kateqoriya → (varsa) daha dərin. Hər addımda
 *      yalnız bir səviyyə göstərilir, geri düyməsi və breadcrumb var.
 *   2. AXTARIŞ — yazan kimi BÜTÜN səviyyələr süzülür və hər nəticə TAM YOLU ilə
 *      göstərilir («Nəqliyyat › Ehtiyat hissələri»), yəni istifadəçi harada
 *      olduğunu itirmir.
 *
 * Yalnız LEAF (alt kateqoriyası olmayan) düyün seçilə bilər — aralıq düyünə klik
 * içəri girir. Səbəb: elan konkret kateqoriyada olmalıdır, «Nəqliyyat» kimi ümumi
 * düyün filtrləri və atribut dəstini müəyyən etməyə imkan vermir.
 */

export type CatNode = {
  id: string;
  slug: string;
  nameAz?: string;
  name_az?: string;
  children?: CatNode[];
};

const nameOf = (c: CatNode) => c.nameAz ?? c.name_az ?? c.slug;

/**
 * Axtarış üçün normallaşdırma: Azərbaycan diakritikləri latın qarşılığına çevrilir.
 * Səbəb — istifadəçi çox vaxt «menzil», «tekerler», «is elanlari» kimi yazır;
 * normallaşdırma olmasa bu sorğular heç nə tapmır. (Backend `/search` də eyni
 * məntiqi tətbiq edir, ona görə davranış saytda vahiddir.)
 */
function norm(v: string): string {
  return v
    .toLowerCase()
    .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c')
    .trim();
}

type FlatLeaf = { node: CatNode; path: CatNode[] };

/** Bütün leaf-ləri tam yolu ilə birlikdə düzləşdirir — yalnız axtarış üçün. */
function collectLeaves(nodes: CatNode[], trail: CatNode[] = [], out: FlatLeaf[] = []): FlatLeaf[] {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.children?.length) collectLeaves(n.children, next, out);
    else out.push({ node: n, path: next });
  }
  return out;
}

/** Seçilmiş id-yə görə tam yolu tapır — düymədə «Nəqliyyat › Avtomobillər» göstərmək üçün. */
function findPath(nodes: CatNode[], id: string, trail: CatNode[] = []): CatNode[] | null {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.id === id) return next;
    if (n.children?.length) {
      const hit = findPath(n.children, id, next);
      if (hit) return hit;
    }
  }
  return null;
}

export default function CategoryPicker({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: CatNode[];
  value: string;
  /**
   * `node` da verilir, çünki çağıran tərəfə kateqoriyanın SLUG-ı lazımdır:
   * dinamik atributlar `/categories/<slug>/attributes` ilə yüklənir, id ilə yox.
   */
  onChange: (id: string, node: CatNode) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  /** Gəzinti yolu — boş massiv = kök səviyyə. */
  const [trail, setTrail] = useState<CatNode[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPath = useMemo(
    () => (value ? findPath(categories, value) : null),
    [categories, value],
  );

  const leaves = useMemo(() => collectLeaves(categories), [categories]);

  const results = useMemo(() => {
    const nq = norm(q);
    if (nq.length < 2) return [];
    // Ad üzrə uyğunluq; yolun valideyn adları da axtarılır ki, «neqliyyat teker»
    // kimi sorğu da işləsin. Ən çox 40 nəticə — uzun siyahı yenidən problemə çevrilir.
    return leaves
      .filter((l) => norm(l.path.map(nameOf).join(' ')).includes(nq))
      .slice(0, 40);
  }, [leaves, q]);

  /** Hazırkı səviyyə: gəzinti yolunun sonuncu düyününün uşaqları, yoxdursa köklər. */
  const level = trail.length ? (trail[trail.length - 1].children ?? []) : categories;

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClick);
    // Açılan kimi axtarışa fokus — klaviatura ilə işləyən istifadəçi dərhal yaza bilir.
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const pick = (n: CatNode) => {
    onChange(n.id, n);
    setOpen(false);
    setQ('');
    setTrail([]);
  };

  const enter = (n: CatNode) => {
    if (n.children?.length) setTrail((t) => [...t, n]);
    else pick(n);
  };

  const ROW =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ' +
    'hover:bg-ink-100 dark:hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap';

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inp flex w-full items-center justify-between gap-2 text-left disabled:opacity-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedPath && (
            <CategoryIcon
              slug={selectedPath[selectedPath.length - 1].slug}
              name={nameOf(selectedPath[selectedPath.length - 1])}
              size="sm"
            />
          )}
          <span className={`truncate ${selectedPath ? '' : 'text-ink-400'}`}>
            {selectedPath
              ? selectedPath.map(nameOf).join(' › ')
              : 'Kateqoriya seçin…'}
          </span>
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Kateqoriya seçimi"
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-menu dark:border-ink-700 dark:bg-ink-800"
        >
          {/* Axtarış — hər zaman yuxarıda, gəzintidən asılı deyil */}
          <div className="border-b border-ink-100 p-2 dark:border-ink-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kateqoriya axtar — məs. telefon, mənzil, tibb"
                aria-label="Kateqoriya axtar"
                className="w-full rounded-xl bg-ink-100 py-2.5 pl-9 pr-9 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-tap dark:bg-ink-900 dark:text-white"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => { setQ(''); inputRef.current?.focus(); }}
                  aria-label="Axtarışı təmizlə"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:bg-ink-200 hover:text-ink-700 dark:hover:bg-ink-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb + geri — yalnız gəzinti rejimində */}
          {!q && trail.length > 0 && (
            <div className="flex items-center gap-1 border-b border-ink-100 px-2 py-1.5 dark:border-ink-700">
              <button
                type="button"
                onClick={() => setTrail((t) => t.slice(0, -1))}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-tap hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tap dark:hover:bg-ink-700"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Geri
              </button>
              <span className="min-w-0 truncate text-[13px] text-ink-500">
                {trail.map(nameOf).join(' › ')}
              </span>
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto p-1.5">
            {q.length >= 2 ? (
              results.length ? (
                <ul>
                  {results.map(({ node, path }) => (
                    <li key={node.id}>
                      <button type="button" onClick={() => pick(node)} className={ROW}>
                        <CategoryIcon slug={path[0].slug} name={nameOf(path[0])} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
                            {nameOf(node)}
                          </span>
                          {/* Tam yol — istifadəçi nəticənin harada olduğunu görür */}
                          <span className="block truncate text-[12px] text-ink-500">
                            {path.slice(0, -1).map(nameOf).join(' › ')}
                          </span>
                        </span>
                        {value === node.id && <Check className="h-4 w-4 shrink-0 text-tap" aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-6 text-center text-sm text-ink-500">
                  «{q}» üzrə kateqoriya tapılmadı
                </p>
              )
            ) : (
              <ul>
                {level.map((n) => {
                  const hasKids = !!n.children?.length;
                  return (
                    <li key={n.id}>
                      <button type="button" onClick={() => enter(n)} className={ROW}>
                        <CategoryIcon slug={n.slug} name={nameOf(n)} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 dark:text-white">
                          {nameOf(n)}
                        </span>
                        {hasKids ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                        ) : (
                          value === n.id && <Check className="h-4 w-4 shrink-0 text-tap" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {q.length === 1 && (
            <p className="border-t border-ink-100 px-3 py-2 text-[12px] text-ink-400 dark:border-ink-700">
              Axtarış üçün ən azı 2 hərf yazın
            </p>
          )}
        </div>
      )}
    </div>
  );
}
