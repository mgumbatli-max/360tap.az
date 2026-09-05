import { Logger } from '@nestjs/common';
import { sanitizeCredential, type DeliveryResult, type MailMessage, type MailTransport } from '../messaging.types';
import { REQUEST_TIMEOUT_MS, describeError, maskEmail, readBody } from './adapter.util';

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * RESEND E-POÇT ADAPTERİ (REST — SDK əlavə edilmir, asılılıq artırmır).
 *
 * NİYƏ RESEND: sadə REST API, domen təsdiqi dəqiqələr çəkir, pulsuz həddi
 * marketplace-in başlanğıc həcminə bəs edir.
 *
 * QEYD: `from` domeni Resend-də TƏSDİQLƏNMƏLİDİR, əks halda 403 gəlir — bu hal
 * `ok:false` kimi qayıdır və səbəb loqda görünür (istifadəçiyə göstərilmir).
 */
export class ResendMailAdapter implements MailTransport {
  readonly name = 'resend';
  readonly configured: boolean;
  /** `configured=false` olduqda səbəb — modul onu startup loqunda çap edir. */
  readonly reason: string | null;

  private readonly logger = new Logger('ResendMail');
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    // Açar HTTP başlığına düşür → ASCII-dən kənar simvol `fetch`-i sındırır.
    // Yoxlama startup-da edilir ki, nasazlıq hər göndərişdə gizli təkrarlanmasın.
    const key = sanitizeCredential(apiKey, 'MAIL_API_KEY');
    const sender = sanitizeCredential(from, 'MAIL_FROM');
    this.apiKey = key.ok ? key.value : '';
    this.from = sender.ok ? sender.value : '';
    this.configured = key.ok && sender.ok;
    this.reason = key.ok ? (sender.ok ? null : sender.reason) : key.reason;
  }

  async send(msg: MailMessage): Promise<DeliveryResult> {
    let res: Response;
    try {
      res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          ...(msg.html ? { html: msg.html } : {}),
        }),
        // Upstream asılarsa qeydiyyat sorğusu 10 s-dən çox gözləməsin.
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      const error = describeError(e);
      this.logger.warn(`Resend şəbəkə xətası (${maskEmail(msg.to)}): ${error}`);
      return { ok: false, error, via: this.name };
    }

    if (!res.ok) {
      const body = await readBody(res);
      this.logger.warn(`Resend upstream ${res.status} (${maskEmail(msg.to)}): ${body}`);
      return { ok: false, error: `HTTP ${res.status}: ${body}`, via: this.name };
    }

    // Cavab: { id: "..." }. Gövdə oxunmasa belə göndəriş uğurludur — id opsionaldır.
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, providerMessageId: data.id, via: this.name };
  }
}
