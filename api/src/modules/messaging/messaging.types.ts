/**
 * MESAJLAŞMA KONTRAKTLARI — E-POÇT VƏ SMS ÜÇÜN TƏK İNTERFEYS.
 *
 * NİYƏ ADAPTER: provayder seçimi biznes qərarıdır və dəyişir. E-poçt üçün
 * Resend, SMS üçün başlanğıcda Twilio (müqavilə tələb etmir), sonra lokal AZ
 * aqreqatoru (SMS başına qat-qat ucuz, amma operator təsdiqi həftələr çəkir).
 * Servis qatı YALNIZ bu interfeysi tanıyır → provayder dəyişəndə tək fayl
 * əlavə olunur, çağıran kod toxunulmur.
 *
 * NİYƏ HEÇ VAXT THROW ETMİR: Faza 0-ın əsas dərsi — opsional infrastruktur
 * prosesi bloklamamalıdır. Mail/SMS provayderi konfiqurasiya olunmayıbsa və ya
 * upstream düşübsə, QEYDİYYAT AXINI ÇÖKMƏMƏLİDİR: nəticə `ok:false` kimi
 * qaytarılır, çağıran tərəf qərar verir (məs. kodu loga yaz, istifadəçiyə
 * «bir azdan yenidən cəhd et» de). İstisna atmaq bütün auth-u ölü provaydere
 * bağlayardı.
 */

export type DeliveryResult = {
  ok: boolean;
  /** Provayderin mesaj id-si — dəstək sorğularında izləmək üçün loglanır. */
  providerMessageId?: string;
  /** `ok:false` olduqda səbəb — İSTİFADƏÇİYƏ GÖSTƏRİLMİR, yalnız loglanır. */
  error?: string;
  /** Hansı adapterin işlədiyi (`resend` | `twilio` | `http` | `console`). */
  via: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  /** Düz mətn variantı MƏCBURİDİR — spam filtrləri yalnız-HTML mektubu cəzalandırır. */
  text: string;
  html?: string;
};

export type SmsMessage = {
  /** E.164 formatında: +994XXXXXXXXX. Normallaşdırma çağırandan ƏVVƏL edilir. */
  to: string;
  text: string;
};

export interface MailTransport {
  readonly name: string;
  /** Konfiqurasiya tam deyilsə `false` — servis bunu görüb konsola düşür. */
  readonly configured: boolean;
  send(msg: MailMessage): Promise<DeliveryResult>;
}

export interface SmsTransport {
  readonly name: string;
  readonly configured: boolean;
  send(msg: SmsMessage): Promise<DeliveryResult>;
}

/** Nest DI açarları — string token, çünki interfeys runtime-da mövcud deyil. */
export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
export const SMS_TRANSPORT = Symbol('SMS_TRANSPORT');

/**
 * TELEFON NORMALLAŞDIRMASI — bir yerdə.
 *
 * Azərbaycan nömrələri istifadəçilər tərəfindən 5 cür yazılır:
 *   0501234567 · 501234567 · +994501234567 · 994501234567 · (050) 123-45-67
 * Normallaşdırma olmasa eyni nömrə üçün ayrı-ayrı OTP sətirləri yaranır və
 * sürət limiti sızır. Hamısı E.164-ə gətirilir: +994501234567.
 *
 * Yalnız AZ nömrələri qəbul edilir (operator kodu 10, 50, 51, 55, 60, 70, 77, 99).
 * Uyğun gəlməyən dəyər üçün `null` — çağıran tərəf 422 qaytarır.
 */
const AZ_OPERATOR_CODES = ['10', '50', '51', '55', '60', '70', '77', '99'];

export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  let local: string;

  if (digits.startsWith('994')) local = digits.slice(3);
  else if (digits.startsWith('0')) local = digits.slice(1);
  else local = digits;

  if (local.length !== 9) return null;
  if (!AZ_OPERATOR_CODES.includes(local.slice(0, 2))) return null;
  return `+994${local}`;
}

/**
 * E-POÇT NORMALLAŞDIRMASI: kiçik hərf + kənar boşluqlar.
 * `Aa@X.az` ilə `aa@x.az` eyni hədəf sayılmalıdır, əks halda sürət limiti sızır.
 * Qeyd: `+etiket` QƏSDƏN silinmir — bəzi provayderlərdə o, ayrı qutudur.
 */
export function normalizeEmail(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}

/**
 * HTTP BAŞLIĞINA GEDƏN KREDENSİALIN TƏMİZLƏNMƏSİ VƏ YOXLANMASI.
 *
 * NİYƏ LAZIM OLDU (real hadisə): API açarı dashboard-a yapışdırılarkən içinə
 * `←` (U+2190) simvolu düşmüşdü. `fetch` başlıq dəyərini ByteString-ə çevirdiyi
 * üçün HƏR göndərişdə belə xəta atılırdı:
 *   «Cannot convert argument to a ByteString because the character at index 15
 *    has a value of 8592 which is greater than 255»
 * Xəta yalnız GÖNDƏRİŞ anında görünürdü — startup isə «Mail provayderi: resend»
 * yazıb hər şeyin qaydasında olduğunu bildirirdi. Yəni nasazlıq gizli qalırdı.
 *
 * İNDİ: dəyər startup-da yoxlanılır. Kənar boşluq/sətir sonu avtomatik silinir
 * (ən çox rast gəlinən paste səhvi), Latın-1-dən kənar simvol varsa kredensial
 * ETİBARSIZ sayılır və adapter `configured=false` qaytarır → sistem konsola düşür
 * və loqda AÇIQ səbəb yazılır.
 */
export type CredentialCheck =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export function sanitizeCredential(raw: string | undefined | null, label: string): CredentialCheck {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: `${label} boşdur` };

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      // Dəyərin ÖZÜ loga yazılmır (sirrdir) — yalnız mövqe və kod göstərilir.
      return {
        ok: false,
        reason: `${label} içində ASCII-dən kənar simvol var (mövqe ${i}, kod ${code}) — dəyəri yenidən yapışdırın`,
      };
    }
    if (code < 32 || code === 127) {
      return { ok: false, reason: `${label} içində idarəedici simvol var (mövqe ${i})` };
    }
  }
  return { ok: true, value };
}
