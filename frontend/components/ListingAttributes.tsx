'use client';

/**
 * KATEQORİYAYA GÖRƏ DİNAMİK XÜSUSİYYƏTLƏR (elan formasının «Xüsusiyyətlər» bölməsi).
 *
 * NİYƏ AYRI KOMPONENT: bazada 268 kateqoriya atributu var və onların forması
 * kateqoriya seçiləndən sonra RUNTIME-da qurulur. Bu məntiqi səhifənin içində
 * saxlamaq həm faylı oxunmaz edir, həm də dəyər çevirmə qaydalarını (mətn → rəqəm,
 * boş → göndərilmir) formanın submit funksiyasına dağıdırdı.
 *
 * BACKEND KONTRAKTI (yoxlanılıb — `GET /categories/<slug>/attributes`):
 *   { id, key, labelAz, labelRu, type, options, unit, isRequired, isFilterable, sortOrder }
 * Real bazada yalnız üç tip işlənir: select(196), number(49), boolean(23).
 * Sxemdə string/multiselect/range/date/location da var — onlar da çökmədən
 * emal olunur (sərbəst mətn kimi), çünki yeni kateqoriya əlavə olunanda forma
 * boş qalmamalıdır.
 *
 * DƏYƏR TİPLƏRİ backend validasiyası ilə uyğun olmalıdır (`validateAttributes`):
 *   number/range → JSON `number`, boolean → JSON `boolean`, qalanı → `string`
 *   və `select` üçün dəyər mütləq `options` siyahısından olmalıdır.
 * Ona görə çevirmə YALNIZ burada, `buildAttributePayload()`-da baş verir.
 */

export type AttrDef = {
  id: string;
  key: string;
  labelAz: string;
  /** Backend enum-u genişlənə bilər, ona görə `string` — tanınmayan tip mətnə düşür. */
  type: string;
  options?: string[] | null;
  unit?: string | null;
  isRequired?: boolean;
  sortOrder?: number;
};

/**
 * Formanın daxili vəziyyəti: boolean atributlar `boolean`, qalanı `string`.
 * Rəqəmi də mətn kimi saxlayırıq — istifadəçi «1.» yazarkən sahə sıçramasın deyə
 * çevirmə yalnız göndəriş anında edilir.
 */
export type AttrValues = Record<string, string | boolean>;

/** `select` üçün neçə variantdan sonra çip yerinə açılan siyahı göstərilir. */
const CHIP_LIMIT = 8;

/**
 * Xətalı sahənin sərhədi. `!` (important) lazımdır, çünki `.inp` sinfi səhifənin
 * daxili `<style>` blokundadır və Tailwind qatından SONRA gəlir — modifikatorsuz
 * `border-danger` sadəcə üzərinə yazılardı. Rəng sabit hex deyil, `danger` tokenidir.
 */
export const INVALID_FIELD = '!border-danger dark:!border-red-400';

/** Tanınmayan tiplər sərbəst mətnə düşür — forma çökməkdənsə sadələşsin. */
const TEXT_TYPES = new Set(['string', 'text', 'date', 'location', 'multiselect']);

/** Atributun dəyəri faktiki olaraq doldurulubmu? (`false` da doldurulmuş sayılır) */
function isFilled(def: AttrDef, value: string | boolean | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return true;
  return value.trim() !== '';
}

/**
 * Forma vəziyyətini backend-in gözlədiyi `attributes` obyektinə çevirir.
 *
 * İki qayda:
 *  1. Yalnız HAZIRKİ kateqoriyanın sxemindəki açarlar keçir — beləliklə köhnə
 *     kateqoriyadan qalmış dəyər (məs. telefonun «memory»-si avtomobil elanında)
 *     heç bir halda sızmır.
 *  2. Boş dəyər ümumiyyətlə göndərilmir (boş sətir YOX, `undefined` da yox) —
 *     əks halda `select` validasiyası «'' siyahıda deyil» deyib 422 qaytarır.
 */
export function buildAttributePayload(defs: AttrDef[], values: AttrValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    const raw = values[def.key];
    if (!isFilled(def, raw)) continue;

    if (def.type === 'boolean') {
      out[def.key] = Boolean(raw);
      continue;
    }
    if (def.type === 'number' || def.type === 'range') {
      // Vergüllə yazılan onluq ayırıcı («1,5») da qəbul olunsun — Azərbaycan
      // klaviaturasında adi haldır, amma `Number('1,5')` NaN verir.
      const num = Number(String(raw).replace(',', '.'));
      if (!Number.isFinite(num)) continue;
      out[def.key] = num;
      continue;
    }
    out[def.key] = String(raw).trim();
  }
  return out;
}

/**
 * Doldurulmamış məcburi atributların açarlarını qaytarır.
 * Göndərişi bloklamaq üçündür — backend eyni yoxlamanı edir, amma orada xəta
 * sahəyə bağlanmır və istifadəçi hansı sahənin qaldığını görmür.
 */
export function missingRequiredAttributes(defs: AttrDef[], values: AttrValues): string[] {
  return defs.filter((d) => d.isRequired && !isFilled(d, values[d.key])).map((d) => d.key);
}

/** Backend cavabını (naməlum JSON) forma vəziyyətinə çevirir — redaktə rejimi üçün. */
export function attributesToValues(raw: unknown): AttrValues {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: AttrValues = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'number' || typeof value === 'string') out[key] = String(value);
    // massiv/obyekt dəyərlər (multiselect) mətn sahəsinə sığmır — atılır ki,
    // istifadəçi «[object Object]» görməsin.
  }
  return out;
}

export default function ListingAttributes({
  attributes,
  values,
  onChange,
  invalidKeys,
  loading,
  hasCategory,
}: {
  attributes: AttrDef[];
  values: AttrValues;
  onChange: (key: string, value: string | boolean) => void;
  /** Göndəriş cəhdində boş qalan məcburi açarlar — sahə qırmızı işarələnir. */
  invalidKeys: string[];
  loading: boolean;
  hasCategory: boolean;
}) {
  if (!hasCategory) {
    return (
      <p className="text-sm text-ink-500 dark:text-ink-400">
        Əvvəlcə kateqoriya seçin — xüsusiyyətlər ona görə dəyişir.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-live="polite">
        <span className="sr-only">Xüsusiyyətlər yüklənir</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
        ))}
      </div>
    );
  }

  if (!attributes.length) {
    return (
      <p className="text-sm text-ink-500 dark:text-ink-400">
        Bu kateqoriya üçün əlavə xüsusiyyət yoxdur — təsvirdə ətraflı yaza bilərsiniz.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {attributes.map((def) => (
        <AttributeField
          key={def.id || def.key}
          def={def}
          value={values[def.key]}
          onChange={onChange}
          invalid={invalidKeys.includes(def.key)}
        />
      ))}
    </div>
  );
}

function AttributeField({
  def,
  value,
  onChange,
  invalid,
}: {
  def: AttrDef;
  value: string | boolean | undefined;
  onChange: (key: string, value: string | boolean) => void;
  invalid: boolean;
}) {
  const fieldId = `attr-${def.key}`;
  const errorId = `${fieldId}-error`;
  const options = Array.isArray(def.options) ? def.options.filter((o) => typeof o === 'string') : [];
  const describedBy = invalid ? errorId : undefined;
  const error = invalid ? <FieldError id={errorId} label={def.labelAz} /> : null;

  // ——— boolean → keçid (switch) ———
  if (def.type === 'boolean') {
    return (
      <div>
        <ToggleRow
          id={fieldId}
          label={def.labelAz}
          checked={value === true}
          onChange={(next) => onChange(def.key, next)}
          describedBy={describedBy}
        />
        {error}
      </div>
    );
  }

  // ——— select + options → çip/radio (az variant) və ya açılan siyahı ———
  if (def.type === 'select' && options.length > 0) {
    const selected = typeof value === 'string' ? value : '';

    if (options.length <= CHIP_LIMIT) {
      return (
        <fieldset aria-describedby={describedBy}>
          <legend className="mb-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-200">
            {def.labelAz} {def.isRequired && <RequiredMark />}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <Chip
                key={opt}
                name={fieldId}
                label={opt}
                checked={selected === opt}
                // Eyni çipə təkrar klik seçimi ləğv edir — məcburi olmayan sahədə
                // istifadəçi «heç biri»nə qayıda bilməlidir.
                onSelect={() => onChange(def.key, selected === opt ? '' : opt)}
                invalid={invalid}
              />
            ))}
          </div>
          {error}
        </fieldset>
      );
    }

    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-200">
          {def.labelAz} {def.isRequired && <RequiredMark />}
        </label>
        <select
          id={fieldId}
          value={selected}
          onChange={(e) => onChange(def.key, e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`inp ${invalid ? INVALID_FIELD : ''}`}
        >
          <option value="">Seçin…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error}
      </div>
    );
  }

  // ——— number → rəqəm sahəsi + vahid ———
  if (def.type === 'number' || def.type === 'range') {
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-200">
          {def.labelAz} {def.isRequired && <RequiredMark />}
        </label>
        <div className="relative">
          <input
            id={fieldId}
            // `type="number"` DEYİL: brauzerin ox düymələri və sürüşdürmə ilə
            // təsadüfi dəyişmə mobil formada çox problem yaradır. Filtr yalnız
            // rəqəm/nöqtə/vergül buraxır, çevirmə isə göndərişdə edilir.
            inputMode="decimal"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(def.key, e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="0"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`inp ${def.unit ? 'pr-14' : ''} ${invalid ? INVALID_FIELD : ''}`}
          />
          {def.unit && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400"
            >
              {def.unit}
            </span>
          )}
        </div>
        {error}
      </div>
    );
  }

  // ——— select(options=null) və tanınmayan tiplər → sərbəst mətn ———
  // Bazada belə 5 atribut var (məs. avtomobil markası): siyahı hələ doldurulmayıb,
  // amma sahə itməməlidir — istifadəçi özü yazır.
  const hint = TEXT_TYPES.has(def.type) || def.type === 'select' ? undefined : def.type;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink-800 dark:text-ink-200">
        {def.labelAz} {def.isRequired && <RequiredMark />}
      </label>
      <input
        id={fieldId}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(def.key, e.target.value)}
        placeholder={hint ? `${def.labelAz} (${hint})` : def.labelAz}
        maxLength={200}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`inp ${invalid ? INVALID_FIELD : ''}`}
      />
      {error}
    </div>
  );
}

function RequiredMark() {
  return (
    <span className="text-danger dark:text-red-400" title="Məcburi sahə">
      *<span className="sr-only"> məcburi</span>
    </span>
  );
}

function FieldError({ id, label }: { id: string; label: string }) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-danger dark:text-red-400">
      «{label}» sahəsi doldurulmalıdır
    </p>
  );
}

/**
 * Çip = gizlədilmiş `radio` + stilləndirilmiş label.
 * `appearance-none` ilə görünməz edilir, `display:none` DEYİL — əks halda
 * klaviatura fokusu və ekran oxuyucusu üçün element ağacdan çıxır.
 */
function Chip({
  name,
  label,
  checked,
  onSelect,
  invalid,
}: {
  name: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  invalid: boolean;
}) {
  return (
    <label
      className={[
        'relative inline-flex cursor-pointer items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        'focus-within:ring-2 focus-within:ring-tap',
        checked
          ? 'border-tap bg-tap text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-tap dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200',
        !checked && invalid ? INVALID_FIELD : '',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        // Seçilmiş çipə təkrar klik → ləğv. `onChange` artıq seçilmiş radio üçün
        // işə düşmür, ona görə ləğv `onClick`-dən keçir.
        onClick={() => { if (checked) onSelect(); }}
        className="absolute h-0 w-0 appearance-none opacity-0"
      />
      {label}
    </label>
  );
}

/** Yalnız görünüşcə keçid — altında əsl `checkbox` var (klaviatura + ekran oxuyucusu). */
export function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
  describedBy,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  describedBy?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const described = [describedBy, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-3 transition-colors hover:border-tap focus-within:ring-2 focus-within:ring-tap dark:border-ink-700 dark:bg-ink-800"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-800 dark:text-ink-200">{label}</span>
        {hint && (
          <span id={hintId} className="mt-0.5 block text-[13px] text-ink-500 dark:text-ink-400">
            {hint}
          </span>
        )}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={described}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        />
        <span
          aria-hidden="true"
          className={`block h-6 w-11 rounded-full transition-colors ${checked ? 'bg-tap' : 'bg-ink-300 dark:bg-ink-600'}`}
        >
          <span
            className={`mt-0.5 block h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'}`}
          />
        </span>
      </span>
    </label>
  );
}
