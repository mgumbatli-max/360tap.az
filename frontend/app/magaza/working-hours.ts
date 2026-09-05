/**
 * İŞ SAATLARI — tolerant oxuyucu + AÇIQ/BAĞLI hesablayıcı.
 *
 * NİYƏ TOLERANT: `Store.workingHours` sxemdə `Json?`-dur və hazırda onu YAZAN endpoint
 * yoxdur (`PATCH /me/store` ayrı işin mövzusudur). Yəni faktiki forma sonradan
 * qərarlaşacaq. Uydurma standart tətbiq etmək əvəzinə ən çox yayılmış üç forma qəbul
 * edilir; tanınmayan data üçün `null` qaytarılır və UI bölməni ÜMUMİYYƏTLƏ göstərmir —
 * səhv iş saatı göstərmək heç nə göstərməməkdən pisdir.
 *
 * Qəbul olunan formalar (açar: mon|monday|1 …):
 *   { mon: "09:00-18:00" }
 *   { mon: { open: "09:00", close: "18:00" } }   // from/to, start/end də olur
 *   { mon: { closed: true } } · { mon: null } · { mon: "bağlı" }
 *   { mon: ["09:00", "18:00"] }
 *
 * SAAT QURŞAĞI: status Bakı vaxtı ilə hesablanır (mağazalar Azərbaycandadır) —
 * serverin və ya ziyarətçinin qurşağı ilə deyil.
 */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  day: DayKey;
  label: string;
  /** «HH:MM» — `closed` true olduqda null. */
  open: string | null;
  close: string | null;
  closed: boolean;
}

const ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const LABELS: Record<DayKey, string> = {
  mon: 'Bazar ertəsi',
  tue: 'Çərşənbə axşamı',
  wed: 'Çərşənbə',
  thu: 'Cümə axşamı',
  fri: 'Cümə',
  sat: 'Şənbə',
  sun: 'Bazar',
};

const SHORT: Record<DayKey, string> = {
  mon: 'B.e', tue: 'Ç.a', wed: 'Ç', thu: 'C.a', fri: 'C', sat: 'Ş', sun: 'B',
};

/** Açarın bütün yayılmış yazılışları → kanonik gün açarı. */
const KEY_ALIASES: Record<string, DayKey> = {
  mon: 'mon', monday: 'mon', '1': 'mon', be: 'mon',
  tue: 'tue', tues: 'tue', tuesday: 'tue', '2': 'tue', ca: 'tue',
  wed: 'wed', weds: 'wed', wednesday: 'wed', '3': 'wed', c: 'wed',
  thu: 'thu', thur: 'thu', thurs: 'thu', thursday: 'thu', '4': 'thu',
  fri: 'fri', friday: 'fri', '5': 'fri',
  sat: 'sat', saturday: 'sat', '6': 'sat', s: 'sat',
  sun: 'sun', sunday: 'sun', '0': 'sun', '7': 'sun', b: 'sun',
};

const CLOSED_WORDS = new Set(['closed', 'off', 'bagli', 'bağlı', 'istirahət', 'istirahet', '-', '']);

export function dayLabel(day: DayKey): string {
  return LABELS[day];
}

export function dayShort(day: DayKey): string {
  return SHORT[day];
}

/** «9:5» → «09:05»; etibarsız dəyər üçün null. */
function normalizeTime(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

type DaySpan = { open: string | null; close: string | null; closed: boolean };

function parseValue(value: unknown): DaySpan | null {
  if (value == null) return { open: null, close: null, closed: true };

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (CLOSED_WORDS.has(v)) return { open: null, close: null, closed: true };
    const parts = v.split(/\s*[-–—]\s*/);
    if (parts.length !== 2) return null;
    const open = normalizeTime(parts[0]);
    const close = normalizeTime(parts[1]);
    return open && close ? { open, close, closed: false } : null;
  }

  if (Array.isArray(value)) {
    const open = normalizeTime(value[0]);
    const close = normalizeTime(value[1]);
    return open && close ? { open, close, closed: false } : null;
  }

  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (o.closed === true || o.isClosed === true) return { open: null, close: null, closed: true };
    const open = normalizeTime(o.open ?? o.from ?? o.start);
    const close = normalizeTime(o.close ?? o.to ?? o.end);
    return open && close ? { open, close, closed: false } : null;
  }

  return null;
}

/**
 * Tanınan ən azı bir gün varsa 7 günlük tam cədvəl qaytarır (adı çəkilməyən gün =
 * bağlı), əks halda `null` → UI bölməni gizlədir.
 */
export function parseWorkingHours(raw: unknown): DayHours[] | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const byDay = new Map<DayKey, DaySpan>();
  for (const [rawKey, value] of Object.entries(raw as Record<string, unknown>)) {
    const day = KEY_ALIASES[rawKey.trim().toLowerCase()];
    if (!day) continue;
    const parsed = parseValue(value);
    if (!parsed) continue;
    byDay.set(day, parsed);
  }

  // Heç bir gün AÇIQ deyilsə cədvəl mənasızdır (məs. `{}` və ya tam zibil obyekt).
  const anyOpen = [...byDay.values()].some((d) => !d.closed);
  if (!anyOpen) return null;

  return ORDER.map((day) => {
    const v = byDay.get(day) ?? { open: null, close: null, closed: true };
    return { day, label: LABELS[day], open: v.open, close: v.close, closed: v.closed };
  });
}

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun',
};

/** Bakı vaxtı ilə cari gün + gecə yarısından keçən dəqiqə. */
export function bakuNow(now: Date = new Date()): { day: DayKey; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Baku',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = WEEKDAY_TO_KEY[get('weekday')];
    // `hour12:false` bəzi mühitlərdə gecə yarısını «24» kimi verir → %24 ilə normallaşdır.
    const h = Number(get('hour')) % 24;
    const m = Number(get('minute'));
    if (!day || Number.isNaN(h) || Number.isNaN(m)) return null;
    return { day, minutes: h * 60 + m };
  } catch {
    // Intl saat qurşağı datası yoxdursa status hesablanmır (bölmə statussuz göstərilir).
    return null;
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface OpenState {
  open: boolean;
  /** Bu gün üçün cədvəl sətri (bağlı gündə də lazımdır). */
  today: DayHours;
  /** Açıqdırsa bağlanma, bağlıdırsa növbəti açılış — «HH:MM». */
  nextChange: string | null;
  /** Növbəti açılış bu gün deyilsə — həmin günün adı. */
  nextDayLabel: string | null;
}

/**
 * AÇIQ/BAĞLI. Gecəni keçən interval (məs. 20:00–02:00) dəstəklənir: belə halda
 * DÜNƏNKİ gün də yoxlanılır, əks halda gecə saat 01:00-da mağaza səhvən «bağlı» görünərdi.
 */
export function computeOpenState(days: DayHours[], nowParts: { day: DayKey; minutes: number }): OpenState {
  const idx = ORDER.indexOf(nowParts.day);
  const today = days[idx];
  const yesterday = days[(idx + 6) % 7];

  const nowMin = nowParts.minutes;

  const isOpenIn = (d: DayHours, offsetDays: 0 | 1): { open: boolean; closesAt: string | null } => {
    if (d.closed || !d.open || !d.close) return { open: false, closesAt: null };
    const o = toMinutes(d.open);
    const c = toMinutes(d.close);
    if (c > o) {
      // Adi interval — yalnız həmin gün.
      return offsetDays === 0 && nowMin >= o && nowMin < c
        ? { open: true, closesAt: d.close }
        : { open: false, closesAt: null };
    }
    // Gecəni keçən interval: bu gün o-dan sonra, dünəndən qalan hissə isə c-dən əvvəl.
    if (offsetDays === 0 && nowMin >= o) return { open: true, closesAt: d.close };
    if (offsetDays === 1 && nowMin < c) return { open: true, closesAt: d.close };
    return { open: false, closesAt: null };
  };

  const cur = isOpenIn(today, 0);
  const carry = cur.open ? cur : isOpenIn(yesterday, 1);
  if (carry.open) {
    return { open: true, today, nextChange: carry.closesAt, nextDayLabel: null };
  }

  // Bağlıdır → növbəti açılışı tap (bu gün gec, yoxsa növbəti günlərdə).
  if (!today.closed && today.open && nowMin < toMinutes(today.open)) {
    return { open: false, today, nextChange: today.open, nextDayLabel: null };
  }
  for (let i = 1; i <= 7; i++) {
    const d = days[(idx + i) % 7];
    if (!d.closed && d.open) {
      return { open: false, today, nextChange: d.open, nextDayLabel: d.label };
    }
  }
  return { open: false, today, nextChange: null, nextDayLabel: null };
}
