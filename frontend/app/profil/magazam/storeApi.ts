/**
 * MAĞAZA KABİNETİ — API QATI.
 *
 * NİYƏ AYRI FAYL: bu ekran backend-in mağaza endpoint-lərinin BİR HİSSƏSİ hələ
 * yazılarkən qurulur (`GET/PATCH /me/store`, filiallar). Endpoint yolları və
 * cavab tipləri tək yerdə toplanır ki, kontraktda fərq çıxsa düzəliş bir faylla
 * bitsin, səhifə komponentlərinə səpələnməsin.
 *
 * NİYƏ `Result` (throw yox): səhifə üç fərqli uğursuzluğu FƏRQLİ göstərməlidir —
 * «endpoint hələ yoxdur», «mağazanız yoxdur», «real xəta». Sadə try/catch bunları
 * bir-birindən ayıra bilmir və nəticədə istifadəçi boş ekran görür.
 */
import { api } from '@/lib/api';

export type StoreStatus = 'pending' | 'active' | 'suspended';

export const WEEK_DAYS = [
  { key: 'mon', label: 'B.e' },
  { key: 'tue', label: 'Ç.a' },
  { key: 'wed', label: 'Ç' },
  { key: 'thu', label: 'C.a' },
  { key: 'fri', label: 'C' },
  { key: 'sat', label: 'Ş' },
  { key: 'sun', label: 'B' },
] as const;

export type WeekDayKey = (typeof WEEK_DAYS)[number]['key'];

/**
 * Bir günün iş rejimi.
 *
 * Sahələr OPSİONALDIR, çünki backend normallaşdırılmış formada yazır:
 * bağlı gün üçün bazada yalnız `{ closed: true }` qalır (artıq `open/close`
 * saxlanmır ki, iki mənbəli həqiqət yaranmasın). Oxuyan tərəf bunu nəzərə almalıdır.
 */
export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

/** `Store.workingHours` Json sahəsinin razılaşdırılmış forması (HH:MM, 24 saatlıq). */
export type WorkingHours = Partial<Record<WeekDayKey, DayHours>>;

export interface MyStore {
  id: string;
  slug: string;
  /** `PATCH /me/store` adı QƏBUL ETMİR: slug addan törəyir və public URL-dir. */
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  status: StoreStatus;
  isVerified: boolean;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  workingHours: WorkingHours | null;
  deliveryTerms: string | null;
  warrantyTerms: string | null;
  activeListings?: number;
  totalListings?: number;
  branches?: number;
  createdAt?: string;
}

export interface StoreBranch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  districtId?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ErpStatus {
  enabled: boolean;
  erpTenantId?: string;
  isActive?: boolean;
  lastSyncAt?: string | null;
  productCount?: number;
}

export interface ErpCredentials {
  erpTenantId: string;
  apiKey: string;
  webhookSecret: string;
  note?: string;
}

/** `POST /me/store` gövdəsi (CreateStoreDto ilə eyni sahələr). */
export interface CreateStorePayload {
  name: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
}

/**
 * `PATCH /me/store` gövdəsi (UpdateStoreDto ilə eyni sahələr).
 * `undefined` = toxunma, `null` = sil. `name` QƏSDƏN yoxdur — backend qəbul etmir.
 */
export interface UpdateStorePayload {
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  workingHours?: WorkingHours | null;
  deliveryTerms?: string | null;
  warrantyTerms?: string | null;
}

/**
 * Uğursuzluq növləri.
 * `missing`  — route ümumiyyətlə yoxdur (backend hələ yazılır) → «hazırlanır».
 * `notFound` — route var, obyekt yoxdur (mağaza açılmayıb) → normal boş hal.
 */
export type FailKind = 'missing' | 'notFound' | 'forbidden' | 'network' | 'error';

export interface Fail {
  kind: FailKind;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; fail: Fail };

/**
 * NestJS-in route tapılmayanda qaytardığı mesaj «Cannot GET /api/v1/...» formasındadır;
 * biznes səviyyəli 404 isə azərbaycanca mesaj qaytarır («Mağaza tapılmadı»). Bu fərq
 * bizə «endpoint hazır deyil» ilə «obyekt yoxdur» hallarını ayırmağa imkan verir —
 * `lib/api.ts` status kodunu deyil, yalnız mesajı ötürdüyü üçün ayrıd edici budur.
 */
const MISSING_ROUTE_RE = /^Cannot (GET|POST|PATCH|PUT|DELETE)\s/i;

export function classifyError(e: unknown): Fail {
  const message = e instanceof Error ? e.message : 'Naməlum xəta';
  if (MISSING_ROUTE_RE.test(message)) {
    return { kind: 'missing', message };
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return { kind: 'network', message: 'Serverlə əlaqə qurulmadı' };
  }
  if (/icazə|forbidden/i.test(message)) {
    return { kind: 'forbidden', message };
  }
  // Backend «mağazanız yoxdur» mesajını da 404 kimi qaytarır — bu, xəta deyil,
  // sadəcə «hələ mağaza açmamısınız» halıdır və ekranda yaratma forması göstərilir.
  if (/tapılmadı|yoxdur|not found/i.test(message)) {
    return { kind: 'notFound', message };
  }
  return { kind: 'error', message };
}

/** `{ ok, data }` zərfini açır; zərfsiz cavab da qəbul edilir. */
export function envelope<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<Result<T>> {
  try {
    const raw = await api<unknown>(path, {
      method: init?.method ?? 'GET',
      ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    return { ok: true, value: envelope<T>(raw) };
  } catch (e) {
    return { ok: false, fail: classifyError(e) };
  }
}

// ---- Endpoint-lər (kontrakt tək yerdə) ----
export const StoreApi = {
  mine: () => call<MyStore>('/me/store'),
  create: (body: CreateStorePayload) => call<MyStore>('/me/store', { method: 'POST', body }),
  update: (body: UpdateStorePayload) => call<MyStore>('/me/store', { method: 'PATCH', body }),
  branches: () => call<StoreBranch[]>('/me/store/branches'),
  addBranch: (body: { name: string; address: string; phone?: string }) =>
    call<StoreBranch>('/me/store/branches', { method: 'POST', body }),
  removeBranch: (id: string) =>
    call<{ id: string }>(`/me/store/branches/${id}`, { method: 'DELETE' }),
  erpStatus: () => call<ErpStatus>('/me/store/erp'),
  erpEnable: () => call<ErpCredentials>('/me/store/erp/enable', { method: 'POST' }),
};

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  pending: 'Təsdiq gözlənilir',
  active: 'Aktiv',
  suspended: 'Dayandırılıb',
};
