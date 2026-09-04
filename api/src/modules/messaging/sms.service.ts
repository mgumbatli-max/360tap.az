import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SMS_TRANSPORT,
  type DeliveryResult,
  type SmsMessage,
  type SmsTransport,
} from './messaging.types';
import { describeError, maskPhone } from './adapters/adapter.util';

/**
 * SMS SERVİSİ — çağıran kodun gördüyü YEGANƏ SMS interfeysi.
 * Davranış qaydaları MailService ilə eynidir: adapter startup-da seçilir,
 * servis heç vaxt throw etmir, nəticə `DeliveryResult` kimi qayıdır.
 *
 * DİQQƏT: `msg.to` E.164 formatında GÖZLƏNİLİR — normallaşdırma (`normalizePhone`)
 * çağıran tərəfdə, sürət limiti hesablanmazdan ƏVVƏL edilməlidir.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger('SmsService');

  constructor(@Inject(SMS_TRANSPORT) private readonly transport: SmsTransport) {}

  get provider(): string {
    return this.transport.name;
  }

  async send(msg: SmsMessage): Promise<DeliveryResult> {
    const who = maskPhone(msg.to);
    try {
      const result = await this.transport.send(msg);
      if (result.ok) {
        this.logger.log(
          `sms göndərildi → ${who} via=${result.via}${result.providerMessageId ? ` id=${result.providerMessageId}` : ''}`,
        );
      } else {
        this.logger.warn(`sms GETMƏDİ → ${who} via=${result.via}: ${result.error ?? 'naməlum səbəb'}`);
      }
      return result;
    } catch (e) {
      const error = describeError(e);
      this.logger.error(`sms adapteri istisna atdı → ${who} via=${this.transport.name}: ${error}`);
      return { ok: false, error, via: this.transport.name };
    }
  }
}
