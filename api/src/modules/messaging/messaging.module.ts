import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/configuration';
import { ConsoleMailAdapter } from './adapters/console-mail.adapter';
import { ConsoleSmsAdapter } from './adapters/console-sms.adapter';
import { HttpSmsAdapter } from './adapters/http-sms.adapter';
import { ResendMailAdapter } from './adapters/resend-mail.adapter';
import { TwilioSmsAdapter } from './adapters/twilio-sms.adapter';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';
import { MAIL_TRANSPORT, SMS_TRANSPORT, type MailTransport, type SmsTransport } from './messaging.types';

/**
 * MESAJLAŞMA MODULU — e-poçt/SMS adapterinin seçildiyi TƏK yer.
 *
 * NİYƏ SEÇİM BURADA: adapter startup-da BİR DƏFƏ qurulur və hansı provayderin
 * aktiv olduğu loqa yazılır. «Mektub/SMS getmir» şikayətinin ilk sualı məhz budur —
 * cavab loqun ilk sətirlərində hazır olsun deyə.
 *
 * NİYƏ @Global: auth, qeydiyyat, parol sıfırlama, gələcəkdə bildirişlər — hamısı
 * çağıracaq. Hər modulda import etmək əvəzinə bir dəfə qlobal verilir (Prisma və
 * Redis modulları ilə eyni üslub).
 *
 * SEÇİM QAYDASI: provayder adı tanınmırsa, boşdursa VƏ YA konfiqurasiyası natamamdırsa
 * → `console`. Startup HEÇ VAXT bloklanmır: yanlış env dəyəri bütün API-ni yıxmamalıdır.
 */

function selectMailTransport(config: ConfigService<AppConfig, true>): MailTransport {
  const logger = new Logger('Messaging');
  const mail = config.get('mail', { infer: true });
  const provider = mail.provider.trim().toLowerCase();

  if (provider === 'resend') {
    const adapter = new ResendMailAdapter(mail.apiKey, mail.from);
    if (adapter.configured) {
      logger.log(`Mail provayderi: resend (from=${mail.from})`);
      return adapter;
    }
    // Səbəb KONKRET yazılır: «natamamdır» kimi ümumi mesaj real hadisədə
    // vaxt itkisinə səbəb oldu — açarın içindəki yad simvol yalnız göndəriş
    // anında, anlaşılmaz ByteString xətası kimi üzə çıxırdı.
    logger.error(`MAIL_PROVIDER=resend, LAKİN İSTİFADƏ EDİLƏ BİLMİR → console. Səbəb: ${adapter.reason}`);
  } else if (provider) {
    logger.warn(`Naməlum MAIL_PROVIDER="${provider}" → console`);
  } else {
    logger.warn('MAIL_PROVIDER təyin edilməyib → console (mektublar yalnız loqa yazılır)');
  }

  warnIfProduction(config, logger, 'Mail');
  return new ConsoleMailAdapter();
}

function selectSmsTransport(config: ConfigService<AppConfig, true>): SmsTransport {
  const logger = new Logger('Messaging');
  const sms = config.get('sms', { infer: true });
  const provider = sms.provider.trim().toLowerCase();

  if (provider === 'twilio') {
    const adapter = new TwilioSmsAdapter(sms.accountSid, sms.authToken, sms.from);
    if (adapter.configured) {
      logger.log(`SMS provayderi: twilio (from=${sms.from})`);
      return adapter;
    }
    logger.warn('SMS_PROVIDER=twilio, lakin SID/TOKEN/FROM natamamdır → console');
  } else if (provider === 'http') {
    const adapter = new HttpSmsAdapter(sms.httpUrl, sms.httpToken, sms.from);
    if (adapter.configured) {
      logger.log(`SMS provayderi: http aqreqator (sender=${sms.from})`);
      return adapter;
    }
    logger.warn('SMS_PROVIDER=http, lakin SMS_HTTP_URL boşdur → console');
  } else if (provider) {
    logger.warn(`Naməlum SMS_PROVIDER="${provider}" → console`);
  } else {
    logger.warn('SMS_PROVIDER təyin edilməyib → console (OTP yalnız loqa yazılır)');
  }

  warnIfProduction(config, logger, 'SMS');
  return new ConsoleSmsAdapter();
}

/**
 * NİYƏ AYRICA XƏBƏRDARLIQ: console adapteri mesaj mətnini (yəni OTP kodunu və
 * sıfırlama linkini) loqa yazır — dev-də bu lazımdır, production-da isə loqa
 * çıxışı olan hər kəs hesaba girə bilər. Səssiz qalmaq təhlükəlidir.
 */
function warnIfProduction(config: ConfigService<AppConfig, true>, logger: Logger, scope: string): void {
  if (config.get('nodeEnv', { infer: true }) === 'production') {
    logger.error(
      `${scope}: PRODUCTION-da console adapteri aktivdir — kodlar/linklər LOQA düşür, təcili provayder konfiqurasiya et`,
    );
  }
}

@Global()
@Module({
  providers: [
    { provide: MAIL_TRANSPORT, inject: [ConfigService], useFactory: selectMailTransport },
    { provide: SMS_TRANSPORT, inject: [ConfigService], useFactory: selectSmsTransport },
    MailService,
    SmsService,
  ],
  exports: [MailService, SmsService],
})
export class MessagingModule {}
