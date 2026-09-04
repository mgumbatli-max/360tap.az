import { Logger } from '@nestjs/common';
import type { DeliveryResult, MailMessage, MailTransport } from '../messaging.types';
import { maskEmail } from './adapter.util';

/**
 * KONSOL E-POÇT ADAPTERİ — provayder konfiqurasiya olunmayanda avtomatik seçilir.
 *
 * NİYƏ: dev-də (və provayder açarı hələ alınmayan production-da) qeydiyyat axını
 * işləməlidir. Təsdiq linki/kodu loqa yazılır, developer oradan oxuyub davam edir.
 * Həmişə `ok:true` qaytarır — çünki «göndərmə» həqiqətən uğurla baş tutub
 * (hədəf konsoldur); çağıran tərəf axını dayandırmamalıdır.
 */
export class ConsoleMailAdapter implements MailTransport {
  readonly name = 'console';
  readonly configured = true;

  private readonly logger = new Logger('ConsoleMail');

  send(msg: MailMessage): Promise<DeliveryResult> {
    // Alıcı maskalanır, MƏTN isə tam yazılır — dev-də linki/kodu oxumaq üçün.
    this.logger.log(`[MAIL→${maskEmail(msg.to)}] ${msg.subject}\n${msg.text}`);
    return Promise.resolve({ ok: true, via: this.name });
  }
}
