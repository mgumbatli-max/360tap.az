import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  Matches,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

/**
 * MAĞAZANIN İŞ SAATLARI — SƏRBƏST JSON DEYİL, SABİT FORMA.
 *
 * NİYƏ: `Store.workingHours` sxemdə `Json?`-dur. Sərbəst JSON qəbul etsək,
 * frontend bu gün `{"mon":"9-18"}`, sabah `{"monday":{"from":...}}` göndərəcək
 * və oxuyan tərəf hər iki formanı təxmin etməyə məcbur qalacaq. Layihədə bu
 * dərs artıq alınıb (elan atributlarında `[object Object]` hadisəsi), ona görə
 * forma DTO ilə kilidlənir və bazaya YALNIZ normallaşdırılmış obyekt yazılır.
 *
 * Qəbul olunan forma:
 *   { "mon": { "open": "09:00", "close": "18:00" }, "sun": { "closed": true } }
 * Göndərilməyən gün = məlumat yoxdur (bağlı deyil, sadəcə bilinmir).
 */

/** HH:MM, 24 saatlıq. Saniyə/zona qəbul edilmir — mağaza saatı üçün lazımsızdır. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

/**
 * Bağlanış açılışdan sonra olmalıdır.
 * "HH:MM" formatında leksik müqayisə xronoloji müqayisə ilə üst-üstə düşür,
 * ona görə tarix obyekti qurmağa ehtiyaq yoxdur.
 */
@ValidatorConstraint({ name: 'closeAfterOpen', async: false })
class CloseAfterOpenConstraint implements ValidatorConstraintInterface {
  validate(close: unknown, args: ValidationArguments): boolean {
    const day = args.object as DayHoursDto;
    if (day.closed === true) return true;
    // Format səhvini `@Matches` bildirir — formatsız dəyərə görə İKİNCİ (və
    // yanıldıcı) mesaj verməyək: "9" > "18:00" leksik olaraq doğrudur, amma
    // istifadəçinin problemi sıralama yox, formatdır.
    if (!TIME_RE.test(String(day.open)) || !TIME_RE.test(String(close))) return true;
    return String(close) > String(day.open);
  }

  defaultMessage(): string {
    return 'Bağlanış saatı açılış saatından sonra olmalıdır';
  }
}

export class DayHoursDto {
  /** `true` → həmin gün istirahətdir; open/close tələb olunmur. */
  @IsOptional()
  @IsBoolean({ message: 'closed yalnız true/false ola bilər' })
  closed?: boolean;

  // `closed` deyilsə hər iki saat MƏCBURİDİR — yarımçıq interval faydasızdır
  // (yalnız açılışı bilmək müştəriyə heç nə demir).
  @ValidateIf((d: DayHoursDto) => d.closed !== true)
  @Matches(TIME_RE, { message: 'Açılış saatı HH:MM formatında olmalıdır (məs. 09:00)' })
  open?: string;

  @ValidateIf((d: DayHoursDto) => d.closed !== true)
  @Matches(TIME_RE, { message: 'Bağlanış saatı HH:MM formatında olmalıdır (məs. 18:00)' })
  @Validate(CloseAfterOpenConstraint)
  close?: string;
}

export class WorkingHoursDto {
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) mon?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) tue?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) wed?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) thu?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) fri?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) sat?: DayHoursDto;
  @IsOptional() @ValidateNested() @Type(() => DayHoursDto) sun?: DayHoursDto;
}

/** Bazaya yazılan yeganə forma (oxuyan tərəf bunu təxmin etməli deyil). */
export type WorkingHoursJson = Partial<
  Record<WeekDay, { closed: true } | { open: string; close: string }>
>;

/**
 * DTO instansını düz obyektə çevirir.
 * NİYƏ: class instansını birbaşa JSONB-yə yazmaq artıq sahələri (məs. `closed`
 * ilə birlikdə gələn köhnə `open`) da daşıyır — bazada iki mənbəli həqiqət yaranır.
 */
export function toWorkingHoursJson(dto: WorkingHoursDto): WorkingHoursJson {
  const out: WorkingHoursJson = {};
  for (const day of WEEK_DAYS) {
    const value = dto[day];
    if (!value) continue;
    if (value.closed === true) {
      out[day] = { closed: true };
      continue;
    }
    // `@ValidateIf` zəmanət verir: bağlı deyilsə hər iki saat mövcuddur.
    if (typeof value.open === 'string' && typeof value.close === 'string') {
      out[day] = { open: value.open, close: value.close };
    }
  }
  return out;
}
