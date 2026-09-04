import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MAIL_TRANSPORT,
  type DeliveryResult,
  type MailMessage,
  type MailTransport,
} from './messaging.types';
import { describeError, maskEmail } from './adapters/adapter.util';

/**
 * E-POÇT SERVİSİ — çağıran kodun gördüyü YEGANƏ e-poçt interfeysi.
 *
 * Adapter seçimi startup-da bir dəfə `MessagingModule`-də edilir (orada hansı
 * provayderin aktiv olduğu loglanır), servis isə yalnız onu işlədir. Beləliklə
 * provayder dəyişəndə auth/qeydiyyat kodu ümumiyyətlə toxunulmur.
 *
 * HEÇ VAXT THROW ETMİR: adapter gözlənilməz istisna atsa belə burada tutulur,
 * çünki e-poçt opsional infrastrukturdur — qeydiyyat axını onun üzündən çökməməlidir.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');

  constructor(@Inject(MAIL_TRANSPORT) private readonly transport: MailTransport) {}

  /** Hansı adapterin aktiv olduğu — sağlamlıq/diaqnostika üçün. */
  get provider(): string {
    return this.transport.name;
  }

  async send(msg: MailMessage): Promise<DeliveryResult> {
    // Alıcı MASKALANMIŞ loglanır — loq faylı şəxsi məlumat bazasına çevrilməsin.
    const who = maskEmail(msg.to);
    try {
      const result = await this.transport.send(msg);
      if (result.ok) {
        this.logger.log(
          `mail göndərildi → ${who} via=${result.via}${result.providerMessageId ? ` id=${result.providerMessageId}` : ''}`,
        );
      } else {
        this.logger.warn(`mail GETMƏDİ → ${who} via=${result.via}: ${result.error ?? 'naməlum səbəb'}`);
      }
      return result;
    } catch (e) {
      // Buraya düşmək adapter səhvidir (kontrakt throw etməməyi tələb edir) —
      // yenə də axını qorumaq üçün nəticəyə çevirilir.
      const error = describeError(e);
      this.logger.error(`mail adapteri istisna atdı → ${who} via=${this.transport.name}: ${error}`);
      return { ok: false, error, via: this.transport.name };
    }
  }
}
