import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { VerificationChannel, VerificationPurpose } from '@prisma/client';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../messaging/mail.service';
import { SmsService } from '../messaging/sms.service';
import type { DeliveryResult } from '../messaging/messaging.types';

/**
 * Kodun ömrü qısa saxlanılır: 6 rəqəmli kodun bütün fəza ölçüsü 10^6-dır, ona görə
 * müdafiə hash-in bahalığı deyil, QISA PƏNCƏRƏ + CƏHD LİMİTİDİR.
 */
const CODE_TTL_SEC = 300;

/** Təkrar göndərmə pəncərəsi — SMS pula gedir, «göndər» düyməsinin döyülməsi bahadır. */
const RESEND_WINDOW_SEC = 60;

/** Bu qədər səhv cəhddən sonra kod ölür — brute force 10^6-nı yox, 5-i sınaya bilir. */
const MAX_ATTEMPTS = 5;

export interface IssueResult {
  /** Yeni kod yaradıldı? Təkrar göndərmə pəncərəsindəyiksə `false`. */
  issued: boolean;
  /** Provayder mesajı qəbul etdi? Mail/SMS servisləri throw etmir, nəticə buradadır. */
  delivered: boolean;
  expiresInSec: number;
  resendAfterSec: number;
  /** YALNIZ non-production — dev/test provaydersiz axını yoxlaya bilsin. */
  devCode?: string;
}

export type VerifyResult =
  | { ok: true; userId: string | null; target: string }
  /**
   * Uğursuzluq SƏBƏBSİZ qaytarılır: «kod yanlışdır» ilə «belə hədəf yoxdur» arasında
   * fərq göstərmək hesab sayımına (enumeration) yol açır.
   */
  | { ok: false };

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly mail: MailService,
    private readonly sms: SmsService,
  ) {}

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  /**
   * Kod yaradır, hash-ini yazır və göndərir.
   * `target` ÇAĞIRANDAN normallaşdırılmış gəlməlidir (normalizePhone/normalizeEmail),
   * əks halda eyni hədəf üçün iki ayrı sətir yaranar və sürət limiti sızar.
   */
  async issue(
    channel: VerificationChannel,
    purpose: VerificationPurpose,
    target: string,
    userId?: string | null,
  ): Promise<IssueResult> {
    const now = new Date();

    // Təkrar göndərmə pəncərəsi son GÖNDƏRİLƏN koda görə hesablanır (istifadə olunub-olunmamasından asılı olmayaraq).
    const last = await this.prisma.verificationCode.findFirst({
      where: { target, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (last) {
      const elapsedSec = Math.floor((now.getTime() - last.createdAt.getTime()) / 1000);
      if (elapsedSec < RESEND_WINDOW_SEC) {
        const remainingLifeSec = Math.max(
          0,
          Math.floor((last.expiresAt.getTime() - now.getTime()) / 1000),
        );
        return {
          issued: false,
          delivered: false,
          expiresInSec: remainingLifeSec,
          resendAfterSec: RESEND_WINDOW_SEC - elapsedSec,
        };
      }
    }

    // Köhnə açıq kodlar ləğv edilir — əks halda iki kod eyni anda etibarlı olardı.
    await this.prisma.verificationCode.updateMany({
      where: { target, purpose, consumedAt: null },
      data: { consumedAt: now },
    });

    // Sətir id-si əvvəlcədən lazımdır: e-poçt tokeni onu daşıyır (aşağıdakı şərhə bax).
    const id = randomUUID();
    const secret = channel === 'sms' ? this.numericCode() : this.urlSafeSecret();
    const codeForUser = channel === 'sms' ? secret : `${id}.${secret}`;

    await this.prisma.verificationCode.create({
      data: {
        id,
        userId: userId ?? null,
        channel,
        purpose,
        target,
        codeHash: this.hashCode(secret, target),
        expiresAt: new Date(now.getTime() + CODE_TTL_SEC * 1000),
      },
    });

    const delivery = await this.deliver(channel, purpose, target, codeForUser);
    if (!delivery.ok) {
      // İstifadəçiyə səbəb GÖSTƏRİLMİR (provayder mətni sızmasın) — yalnız log.
      this.logger.warn(
        `Doğrulama kodu göndərilmədi (${channel}/${purpose}, via=${delivery.via}): ${delivery.error ?? 'naməlum'}`,
      );
    }

    return {
      issued: true,
      delivered: delivery.ok,
      expiresInSec: CODE_TTL_SEC,
      resendAfterSec: RESEND_WINDOW_SEC,
      ...(this.isProduction() ? {} : { devCode: codeForUser }),
    };
  }

  /**
   * Hədəf + kod üzrə doğrulama (SMS OTP axını).
   * Uğurda kod «istifadə olunmuş» işarələnir — eyni kod ikinci dəfə işləmir.
   */
  async verify(
    purpose: VerificationPurpose,
    target: string,
    code: string,
  ): Promise<VerifyResult> {
    const record = await this.prisma.verificationCode.findFirst({
      where: { target, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return this.checkRecord(record, code);
  }

  /**
   * Link tokeni üzrə doğrulama (e-poçt axını).
   * NİYƏ tokenin içində sətir id-si var: hash pepper-i kimi hədəf (e-poçt) iştirak edir,
   * amma link-dən gələn sorğuda hədəf YOXDUR — yalnız token. Sətri tapmaq üçün
   * `<id>.<sirr>` formatı işlədilir; sirr hissəsi 32 baytdır, id-nin özü sirr deyil.
   */
  async verifyToken(purpose: VerificationPurpose, token: string): Promise<VerifyResult> {
    const separator = token.indexOf('.');
    if (separator <= 0) return { ok: false };

    const id = token.slice(0, separator);
    const secret = token.slice(separator + 1);

    const record = await this.prisma.verificationCode.findFirst({
      where: { id, purpose, consumedAt: null },
    });
    return this.checkRecord(record, secret);
  }

  // -----------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------

  private async checkRecord(
    record: {
      id: string;
      userId: string | null;
      target: string;
      codeHash: string;
      attempts: number;
      expiresAt: Date;
    } | null,
    code: string,
  ): Promise<VerifyResult> {
    if (!record) return { ok: false };
    if (record.expiresAt.getTime() <= Date.now()) return { ok: false };
    if (record.attempts >= MAX_ATTEMPTS) return { ok: false };

    const expected = record.codeHash;
    const actual = this.hashCode(code, record.target);
    if (!this.hashesMatch(expected, actual)) {
      const attempts = record.attempts + 1;
      await this.prisma.verificationCode.updateMany({
        where: { id: record.id, consumedAt: null },
        data: {
          attempts,
          // Limit dolduqda kod DƏRHAL ölür — yeni kod tələb olunur.
          ...(attempts >= MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
      return { ok: false };
    }

    // Tək istifadə atomik təmin olunur: `consumedAt: null` şərti yarışan iki sorğudan
    // yalnız birinin keçməsinə imkan verir.
    const consumed = await this.prisma.verificationCode.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) return { ok: false };

    return { ok: true, userId: record.userId, target: record.target };
  }

  /**
   * SHA-256(kod + hədəf + JWT_SECRET). JWT_SECRET pepper rolundadır: yalnız-baza
   * sızmasında (server sirri olmadan) kodu hesablamaq mümkün olmasın.
   */
  private hashCode(code: string, target: string): string {
    const pepper = this.config.get('jwt', { infer: true }).secret;
    return createHash('sha256').update(`${code}:${target}:${pepper}`).digest('hex');
  }

  /** Sətir bərabərliyi ilk fərqli baytda dayanır və vaxt sızması verir — sabit vaxtlı müqayisə. */
  private hashesMatch(a: string, b: string): boolean {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    if (left.length !== right.length || left.length === 0) return false;
    return timingSafeEqual(left, right);
  }

  /** `randomInt` kriptoqrafik mənbədən gəlir — `Math.random` proqnozlaşdırıla biləndir. */
  private numericCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /** 32 bayt entropiya — link tokeni brute force ilə tapıla bilməz. */
  private urlSafeSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  private isProduction(): boolean {
    return this.config.get('nodeEnv', { infer: true }) === 'production';
  }

  private async deliver(
    channel: VerificationChannel,
    purpose: VerificationPurpose,
    target: string,
    code: string,
  ): Promise<DeliveryResult> {
    if (channel === 'sms') {
      return this.sms.send({
        to: target,
        text: `360tap.az təsdiq kodu: ${code}. ${Math.floor(CODE_TTL_SEC / 60)} dəqiqə etibarlıdır. Kodu heç kimə deməyin.`,
      });
    }

    const publicUrl = this.config.get('publicUrl', { infer: true }).replace(/\/+$/, '');

    // ⚠️ BU YOLLAR FRONTEND QOVLUQ ADLARI İLƏ HƏRFBƏHƏRF ÜST-ÜSTƏ DÜŞMƏLİDİR:
    //   frontend/app/e-poct-tesdiq/page.tsx   ← e-poçt təsdiqi
    //   frontend/app/parol-sifirla/page.tsx   ← parol bərpası
    // Bir dəfə uyğunsuzluq oldu (backend `/e-poct-tesdiq`, frontend `/email-tesdiq`)
    // və mektubdakı link 404 verdi. Səhv YALNIZ istifadəçi linkə kliklədikdə üzə çıxır —
    // nə tsc, nə lint, nə də build onu tuta bilmir. Bu yolları dəyişirsənsə,
    // həmin qovluğun adını da EYNİ commit-də dəyiş.
    const path = purpose === 'reset_password' ? '/parol-sifirla' : '/e-poct-tesdiq';
    const link = `${publicUrl}${path}?token=${encodeURIComponent(code)}`;

    const isReset = purpose === 'reset_password';
    const subject = isReset ? '360tap.az — parolun bərpası' : '360tap.az — e-poçtu təsdiqləyin';
    const lead = isReset
      ? 'Parolunuzu bərpa etmək üçün aşağıdakı linkə keçin.'
      : 'E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı linkə keçin.';
    const tail = `Link ${Math.floor(CODE_TTL_SEC / 60)} dəqiqə etibarlıdır. Bu sorğunu siz göndərməmisinizsə, bu mektubu nəzərə almayın.`;

    return this.mail.send({
      to: target,
      subject,
      // Düz mətn variantı MƏCBURİDİR — yalnız-HTML mektub spam filtrindən keçmir.
      text: `${lead}\n\n${link}\n\n${tail}`,
      html: `<p>${lead}</p><p><a href="${link}">${link}</a></p><p>${tail}</p>`,
    });
  }
}
