'use client';
import { useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowUpDown,
  Banknote,
  ChevronDown,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { azNumber } from '@/lib/format';
import { useResilientPush } from '@/lib/resilient-navigation';
import { dependentAttributeKeys, resolveAttributeOptions } from '@/lib/attribute-taxonomy';

export type CatAttr = {
  key: string;
  labelAz: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: string[] | null;
  isFilterable?: boolean;
};

export type FilterRegion = { slug: string; name: string };
export type FilterSort = { v: string; name: string };

/**
 * Naviqasiya açarları — «neçə filtr aktivdir» sayımına DAXİL EDİLMİR.
 * `category`/`vertical` səhifənin kimliyidir, `sort`/`view`/`page` isə görünüş
 * parametridir; onları filtr kimi saymaq «Bütün filtrlər» nişanını həmişə yandırardı.
 */
const NAV_KEYS = new Set(['q', 'category', 'vertical', 'sort', 'page', 'view']);

/**
 * Üfüqi filtr paneli (spesifikasiya §8.3).
 *
 * Bütün vəziyyət URL-də saxlanılır — lokal filtr state-i YOXDUR. Səbəb: nəticələri
 * server komponenti render edir, ona görə yeganə həqiqət mənbəyi `searchParams`
 * olmalıdır (geri düyməsi, paylaşılan link və SSR eyni nəticəni verir).
 */
export default function CategoryFilters({
  attributes,
  regions,
  sorts,
  total,
  resultsAnchor = '#netice',
}: {
  attributes: CatAttr[];
  regions: FilterRegion[];
  sorts: FilterSort[];
  total: number;
  /** CTA-nın sıçradığı nəticə bloku (səhifə həmin `id`-ni verir). */
  resultsAnchor?: string;
}) {
  // Adi naviqasiya ƏVƏZİNƏ qoruyucu variant: App Router naviqasiyaların ~5%-ni
  // səssizcə atır (ölçüldü) və filtr tətbiq olunmamış qalır — sübut və mexanizm
  // `lib/resilient-navigation.ts` şərhindədir.
  const push = useResilientPush();
  const pathname = usePathname();
  const params = useSearchParams();
  const [allOpen, setAllOpen] = useState(false);

  const get = (k: string) => params.get(k) ?? '';

  const apply = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    // Filtr dəyişdi → 3-cü səhifədə qalıb boş nəticə görünməsin.
    p.delete('page');
    const s = p.toString();
    push(s ? `${pathname}?${s}` : pathname);
  };

  /**
   * Atribut filtri. Valideyn atribut (marka) dəyişəndə ondan asılı filtr (model)
   * də URL-dən silinir — əks halda «Mercedes-Benz + Corolla» kimi heç vaxt
   * nəticə verməyən kombinasiya linkdə qalırdı.
   */
  const setAttr = (key: string, value: string) => {
    const patch: Record<string, string> = { [`a_${key}`]: value };
    for (const dep of dependentAttributeKeys(key)) patch[`a_${dep}`] = '';
    apply(patch);
  };

  /** Filtrləri sıfırla, amma kateqoriya/axtarış kimliyini SAXLA. */
  const reset = () => {
    const p = new URLSearchParams();
    for (const k of ['q', 'category', 'vertical']) {
      const v = params.get(k);
      if (v) p.set(k, v);
    }
    const s = p.toString();
    push(s ? `${pathname}?${s}` : pathname);
  };

  const categorySlug = get('category');

  /**
   * Filtrlənə bilən select atributları — seçim siyahısı İKİ mənbədən gəlir:
   * sxem (`a.options`) və klient taksonomiyası (`resolveAttributeOptions`).
   *
   * ƏVVƏL burada yalnız `(a.options?.length ?? 0) > 0` şərti vardı, ona görə
   * seed-də `options` boş olan atributlar (avtomobildə MARKA və MODEL) filtr
   * panelində ÜMUMİYYƏTLƏ görünmürdü — yəni avtomobil axtaranın ən vacib iki
   * filtri yox idi. İndi siyahısı olmayan atribut taksonomiyadan doldurulur,
   * valideyndən asılı olan (model) isə `blockedBy` ilə deaktiv göstərilir —
   * gizlətmək əvəzinə səbəbi izah edir.
   */
  type ResolvedSelect = CatAttr & { opts: string[]; blockedBy?: string };
  const selects: ResolvedSelect[] = attributes
    .filter((a) => a.isFilterable !== false && a.type === 'select')
    .map((a): ResolvedSelect | null => {
      const resolved = resolveAttributeOptions(categorySlug, a, (k) => get(`a_${k}`));
      if (resolved?.status === 'needs-parent') {
        return { ...a, opts: [], blockedBy: resolved.parentLabelAz };
      }
      const opts = resolved?.options ?? a.options ?? [];
      return opts.length > 0 ? { ...a, opts } : null;
    })
    .filter((a): a is ResolvedSelect => a !== null);

  const numbers = attributes.filter((a) => a.isFilterable !== false && a.type === 'number');
  const bools = attributes.filter((a) => a.isFilterable !== false && a.type === 'boolean');

  const activeCount = Array.from(params.keys()).filter(
    (k) => !NAV_KEYS.has(k) && (params.get(k) ?? '') !== '',
  ).length;

  const mapOn = get('view') === 'map';
  const ctaLabel = total > 0 ? `${azNumber(total)} elan göstər` : 'Nəticələrə bax';

  // Panelin daxilində yalnız ilk 3 atribut görünür — qalanı «Bütün filtrlər»dədir.
  // Səbəb: 64px-lik zolaq geniş ekranda da yalnız 6 bölmə saxlaya bilir, əks halda
  // sahələr sıxılıb oxunmaz olur.
  const inlineSelects = selects.slice(0, 3);

  return (
    <div className="mb-4">
      {/* ——— 64px üfüqi zolaq ——— */}
      <div className="flex items-stretch rounded-2xl bg-ink-100 dark:bg-ink-800 md:h-16">
        {/* Sahələr yalnız ≥md-də zolağın içindədir; mobildə hamısı «Bütün filtrlər» panelindədir */}
        <div className="hidden min-w-0 flex-1 items-stretch md:flex">
          <BarField icon={MapPin} label="Region">
            <BarSelect
              label="Region"
              value={get('region')}
              onChange={(v) => apply({ region: v })}
            >
              {regions.map((r) => (
                <option key={r.slug || 'all'} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </BarSelect>
          </BarField>

          <BarField icon={Banknote} label="Qiymət, ₼">
            <div className="mt-1 flex items-center gap-1">
              <BarNumber
                label="Minimum qiymət"
                placeholder="min"
                value={get('priceMin')}
                onCommit={(v) => apply({ priceMin: v })}
              />
              <span className="text-ink-400">—</span>
              <BarNumber
                label="Maksimum qiymət"
                placeholder="max"
                value={get('priceMax')}
                onCommit={(v) => apply({ priceMax: v })}
              />
            </div>
          </BarField>

          <BarField icon={ArrowUpDown} label="Sıralama">
            <BarSelect
              label="Sıralama"
              value={get('sort') || sorts[0]?.v || ''}
              onChange={(v) => apply({ sort: v })}
            >
              {sorts.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.name}
                </option>
              ))}
            </BarSelect>
          </BarField>

          {inlineSelects.map((a, i) => (
            <BarField
              key={a.key}
              icon={SlidersHorizontal}
              label={a.labelAz}
              // 2-ci və 3-cü atribut yalnız geniş ekranlarda — dar ekranda sahələr sıxılmasın
              className={i === 1 ? 'hidden lg:flex' : i === 2 ? 'hidden xl:flex' : ''}
            >
              <BarSelect
                label={a.labelAz}
                value={get(`a_${a.key}`)}
                onChange={(v) => setAttr(a.key, v)}
                disabled={Boolean(a.blockedBy)}
              >
                <option value="">{a.blockedBy ? `Əvvəlcə «${a.blockedBy}»` : 'Hamısı'}</option>
                {a.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </BarSelect>
            </BarField>
          ))}
        </div>

        {/* ——— Aksiyalar: Bütün filtrlər · Xəritədə · qara CTA ——— */}
        <div className="flex w-full items-center gap-2 border-ink-200 px-2 py-2 dark:border-ink-700 md:w-auto md:border-l md:py-0 md:pl-3 md:pr-3">
          <button
            type="button"
            onClick={() => setAllOpen((v) => !v)}
            aria-expanded={allOpen}
            aria-controls="butun-filtrler"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-white dark:text-ink-200 dark:hover:bg-ink-700"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Bütün filtrlər</span>
            <span className="sm:hidden">Filtrlər</span>
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-tap px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => apply({ view: mapOn ? '' : 'map' })}
            aria-pressed={mapOn}
            aria-label={mapOn ? 'Siyahı görünüşünə qayıt' : 'Xəritədə göstər'}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition ${
              mapOn
                ? 'bg-tap text-white'
                : 'text-ink-700 hover:bg-white dark:text-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Xəritədə</span>
          </button>

          <a
            href={resultsAnchor}
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center truncate rounded-xl bg-ink-900 px-4 text-[13px] font-bold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-200 md:flex-none"
          >
            {ctaLabel}
          </a>
        </div>
      </div>

      {/* ——— «Bütün filtrlər» açılan paneli — mobildə YEGANƏ filtr səthidir ——— */}
      {allOpen && (
        <div
          id="butun-filtrler"
          className="mt-2 rounded-2xl bg-ink-100 p-4 dark:bg-ink-800"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PanelBox label="Region">
              <PanelSelect
                label="Region"
                value={get('region')}
                onChange={(v) => apply({ region: v })}
              >
                {regions.map((r) => (
                  <option key={r.slug || 'all'} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </PanelSelect>
            </PanelBox>

            <PanelBox label="Qiymət, ₼">
              <div className="flex items-center gap-2">
                <PanelNumber
                  label="Minimum qiymət"
                  placeholder="min"
                  value={get('priceMin')}
                  onCommit={(v) => apply({ priceMin: v })}
                />
                <span className="text-ink-400">—</span>
                <PanelNumber
                  label="Maksimum qiymət"
                  placeholder="max"
                  value={get('priceMax')}
                  onCommit={(v) => apply({ priceMax: v })}
                />
              </div>
            </PanelBox>

            <PanelBox label="Sıralama">
              <PanelSelect
                label="Sıralama"
                value={get('sort') || sorts[0]?.v || ''}
                onChange={(v) => apply({ sort: v })}
              >
                {sorts.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.name}
                  </option>
                ))}
              </PanelSelect>
            </PanelBox>

            {selects.map((a) => (
              <PanelBox key={a.key} label={a.labelAz}>
                <PanelSelect
                  label={a.labelAz}
                  value={get(`a_${a.key}`)}
                  onChange={(v) => setAttr(a.key, v)}
                  disabled={Boolean(a.blockedBy)}
                >
                  <option value="">
                    {a.blockedBy ? `Əvvəlcə «${a.blockedBy}» seçin` : 'Hamısı'}
                  </option>
                  {a.opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </PanelSelect>
              </PanelBox>
            ))}

            {numbers.map((a) => (
              <PanelBox key={a.key} label={a.labelAz}>
                <div className="flex items-center gap-2">
                  <PanelNumber
                    label={`${a.labelAz} — minimum`}
                    placeholder="min"
                    value={get(`a_${a.key}_min`)}
                    onCommit={(v) => setAttr(`${a.key}_min`, v)}
                  />
                  <span className="text-ink-400">—</span>
                  <PanelNumber
                    label={`${a.labelAz} — maksimum`}
                    placeholder="max"
                    value={get(`a_${a.key}_max`)}
                    onCommit={(v) => setAttr(`${a.key}_max`, v)}
                  />
                </div>
              </PanelBox>
            ))}
          </div>

          {bools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bools.map((a) => {
                const on = get(`a_${a.key}`) === 'true';
                return (
                  <button
                    key={a.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAttr(a.key, on ? '' : 'true')}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                      on
                        ? 'bg-tap text-white'
                        : 'bg-white text-ink-700 hover:bg-ink-200 dark:text-ink-200'
                    }`}
                  >
                    {a.labelAz}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-200 pt-3 dark:border-ink-700">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition hover:text-danger dark:text-ink-400"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Sıfırla
            </button>
            <a
              href={resultsAnchor}
              onClick={() => setAllOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-ink-900 px-5 text-[13px] font-bold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-200"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ————————————————— zolaq daxili elementlər ————————————————— */

/** Zolaq bölməsi: 1px şaquli ayırıcı + ikon + etiket (spesifikasiya §8.3). */
function BarField({
  icon: Icon,
  label,
  children,
  className = '',
}: {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 border-l border-ink-200 px-4 first:border-l-0 dark:border-ink-700 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold uppercase leading-none tracking-wide text-ink-400">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Zolaqdakı select sərhədsiz və şəffafdır — səthi panelin özü verir.
 * `dark:!bg-transparent` lazımdır, çünki `globals.css`-də `.dark select` üçün
 * `!important` fon var; onu yalnız daha yüksək spesifikliyi olan sinif keçə bilir.
 */
function BarSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  /** Valideyn atribut seçilməyibsə (marka→model) sahə görünür, amma seçilə bilmir. */
  disabled?: boolean;
}) {
  return (
    <div className="relative mt-1">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none truncate bg-transparent pr-5 text-sm font-bold leading-none outline-none dark:!bg-transparent ${
          disabled
            ? 'cursor-not-allowed text-ink-400'
            : 'cursor-pointer text-ink-900 dark:text-white'
        }`}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * `key={value}` qəsdəndir: URL dəyişəndə input yenidən qurulur, əks halda
 * «Sıfırla»dan sonra köhnə rəqəm DOM-da qalırdı (uncontrolled input problemi).
 */
function BarNumber({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <input
      key={value}
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={label}
      placeholder={placeholder}
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className="w-full min-w-0 bg-transparent text-sm font-bold leading-none text-ink-900 outline-none placeholder:font-medium placeholder:text-ink-400 dark:!bg-transparent dark:text-white"
    />
  );
}

/* ————————————————— açılan panel elementləri ————————————————— */

function PanelBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 dark:bg-ink-900">
      <div className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </div>
      {children}
    </div>
  );
}

function PanelSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none truncate bg-transparent pr-5 text-sm font-semibold outline-none dark:!bg-transparent ${
          disabled
            ? 'cursor-not-allowed text-ink-400'
            : 'cursor-pointer text-ink-900 dark:text-white'
        }`}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
    </div>
  );
}

function PanelNumber({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <input
      key={value}
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={label}
      placeholder={placeholder}
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className="w-full min-w-0 bg-transparent text-sm font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400 dark:!bg-transparent dark:text-white"
    />
  );
}
