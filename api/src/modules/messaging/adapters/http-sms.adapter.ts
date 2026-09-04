import { Logger } from '@nestjs/common';
import type { DeliveryResult, SmsMessage, SmsTransport } from '../messaging.types';
import { REQUEST_TIMEOUT_MS, describeError, maskPhone, readBody } from './adapter.util';

/**
 * ÜMUMİ HTTP SMS ADAPTERİ — LOKAL AZ AQREQATORU ÜÇÜN.
 *
 * NİYƏ AYRICA ADAPTER: lokal aqreqatorlar (Azercell/Bakcell alfa-nömrə satıcıları)
 * demək olar həmişə «bir POST + Bearer açar» modelidir, amma sahə adları hər
 * şirkətdə fərqlidir. Müqavilə hələ bağlanmayıb, dəqiq format məlum deyil.
 * Ona görə bu adapter QƏSDƏN sadə saxlanılıb: aqreqator sənədi gələndə YALNIZ
 * aşağıdakı iki nöqtə dəyişəcək, qalan kod (servis, auth, OTP axını) toxunulmayacaq.
 *
 * ═══ AQREQATORA GÖRƏ DƏYİŞƏCƏK NÖQTƏLƏR ═══
 *   1) SORĞU GÖVDƏSİ — hazırda `{ to, text, sender }`.
 *      Tipik alternativlər: `{ msisdn, message, from }`, `{ phone, body, alphaname }`.
 *      → `buildPayload()` metodunu dəyiş.
 *   2) UĞUR ƏLAMƏTİ və MESAJ İD-Sİ — hazırda HTTP 2xx = uğur, id üçün
 *      `id | messageId | msgId` sahələrindən ilk tapılan götürülür.
 *      Bəzi aqreqatorlar HTTP 200 ilə birlikdə gövdədə `{ status: "ERROR" }`
 *      qaytarır — belə halda `interpret()` metoduna həmin yoxlamanı əlavə et.
 *   3) AUTENTİFİKASİYA — hazırda `Authorization: Bearer <SMS_HTTP_TOKEN>`.
 *      Bəzi aqreqatorlar login/parolu gövdədə istəyir → başlığı oradan sil,
 *      `buildPayload()`-a əlavə et.
 */
export class HttpSmsAdapter implements SmsTransport {
  readonly name = 'http';
  readonly configured: boolean;

  private readonly logger = new Logger('HttpSms');

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly sender: string,
  ) {
    // Token opsionaldır (bəzi aqreqatorlar IP ağ siyahısı ilə işləyir) — URL isə məcburi.
    this.configured = !!url;
  }

  /** ① AQREQATOR SƏNƏDİNƏ GÖRƏ DƏYİŞ: sorğu gövdəsinin sahə adları. */
  private buildPayload(msg: SmsMessage): Record<string, string> {
    return { to: msg.to, text: msg.text, sender: this.sender };
  }

  /** ② AQREQATOR SƏNƏDİNƏ GÖRƏ DƏYİŞ: cavabdan mesaj id-sinin çıxarılması. */
  private interpret(body: unknown): { providerMessageId?: string } {
    if (typeof body !== 'object' || body === null) return {};
    const b = body as Record<string, unknown>;
    const id = b.id ?? b.messageId ?? b.msgId;
    return typeof id === 'string' ? { providerMessageId: id } : {};
  }

  async send(msg: SmsMessage): Promise<DeliveryResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // ③ AQREQATOR SƏNƏDİNƏ GÖRƏ DƏYİŞ: autentifikasiya üsulu.
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(this.buildPayload(msg)),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      const error = describeError(e);
      this.logger.warn(`SMS aqreqatoru şəbəkə xətası (${maskPhone(msg.to)}): ${error}`);
      return { ok: false, error, via: this.name };
    }

    if (!res.ok) {
      const body = await readBody(res);
      this.logger.warn(`SMS aqreqatoru upstream ${res.status} (${maskPhone(msg.to)}): ${body}`);
      return { ok: false, error: `HTTP ${res.status}: ${body}`, via: this.name };
    }

    const data: unknown = await res.json().catch(() => ({}));
    return { ok: true, ...this.interpret(data), via: this.name };
  }
}
