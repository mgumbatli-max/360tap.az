import { Logger } from '@nestjs/common';
import type { DeliveryResult, SmsMessage, SmsTransport } from '../messaging.types';
import { REQUEST_TIMEOUT_MS, describeError, maskPhone, readBody } from './adapter.util';

/**
 * TWILIO SMS ADAPTERİ (REST — `twilio` SDK-sı QƏSDƏN yüklənmir).
 *
 * NİYƏ REST: SDK 3 MB-dan çox asılılıq gətirir və Render-də soyuq başlanğıcı
 * uzadır; bizə lazım olan tək endpoint-dir. NİYƏ TWILIO: müqavilə tələb etmir,
 * bu gün işə düşür — lokal AZ aqreqatoru təsdiqlənənə qədər körpü rolunu oynayır.
 */
export class TwilioSmsAdapter implements SmsTransport {
  readonly name = 'twilio';
  readonly configured: boolean;

  private readonly logger = new Logger('TwilioSms');
  private readonly url: string;
  private readonly auth: string;

  constructor(
    accountSid: string,
    authToken: string,
    private readonly from: string,
  ) {
    this.configured = !!accountSid && !!authToken && !!from;
    this.url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
    this.auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  }

  async send(msg: SmsMessage): Promise<DeliveryResult> {
    // Twilio YALNIZ form-urlencoded qəbul edir — JSON göndərsək 400 gəlir.
    const form = new URLSearchParams({ To: msg.to, From: this.from, Body: msg.text });

    let res: Response;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      const error = describeError(e);
      this.logger.warn(`Twilio şəbəkə xətası (${maskPhone(msg.to)}): ${error}`);
      return { ok: false, error, via: this.name };
    }

    if (!res.ok) {
      const body = await readBody(res);
      this.logger.warn(`Twilio upstream ${res.status} (${maskPhone(msg.to)}): ${body}`);
      return { ok: false, error: `HTTP ${res.status}: ${body}`, via: this.name };
    }

    const data = (await res.json().catch(() => ({}))) as { sid?: string };
    return { ok: true, providerMessageId: data.sid, via: this.name };
  }
}
