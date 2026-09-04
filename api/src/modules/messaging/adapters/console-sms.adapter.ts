import { Logger } from '@nestjs/common';
import type { DeliveryResult, SmsMessage, SmsTransport } from '../messaging.types';
import { maskPhone } from './adapter.util';

/**
 * KONSOL SMS ADAPTERİ — SMS provayderi yoxdursa avtomatik seçilir.
 * Lokal AZ aqreqatoru ilə müqavilə həftələr çəkir, ona qədər OTP loqdan oxunur.
 */
export class ConsoleSmsAdapter implements SmsTransport {
  readonly name = 'console';
  readonly configured = true;

  private readonly logger = new Logger('ConsoleSms');

  send(msg: SmsMessage): Promise<DeliveryResult> {
    this.logger.log(`[SMS→${maskPhone(msg.to)}] ${msg.text}`);
    return Promise.resolve({ ok: true, via: this.name });
  }
}
