/**
 * Formaların backend qaydaları ilə uyğunlaşdırılması üçün ortaq validasiya sabitləri.
 *
 * PROBLEM: qeydiyyat formaları «min 6 simvol» reklam edirdi, backend isə
 * `api/src/modules/auth/dto/register.dto.ts` (PASSWORD_RE + MinLength(8)) 8+ simvol,
 * hərf VƏ rəqəm tələb edir → istifadəçi formanı doldurub 422 alırdı.
 *
 * DİQQƏT: bu regex backend DTO-sunun SURƏTİdir — iki mənbədir. Backend parol siyasəti
 * dəyişəndə burası da yenilənməlidir (yeganə alternativ — qaydanı API-dən oxumaq — bir
 * forma üçün əlavə şəbəkə asılılığı yaradır, ona görə rədd edildi).
 */

/** Backend ilə eyni: ən azı 8 simvol, ən azı bir hərf və bir rəqəm. */
export const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

/** HTML `pattern` atributu üçün eyni qayda (regex sərhədləri olmadan). */
export const PASSWORD_PATTERN = '(?=.*[a-zA-Z])(?=.*\\d).{8,}';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT = 'Ən azı 8 simvol, hərf və rəqəm';

export const PASSWORD_PLACEHOLDER = 'Parol (min 8 simvol, hərf və rəqəm) *';

/** Qayda pozulubsa xəta mətni, düzgündürsə `null`. */
export function validatePassword(password: string): string | null {
  return PASSWORD_RE.test(password)
    ? null
    : 'Parol ən azı 8 simvol olmalı, hərf və rəqəm ehtiva etməlidir';
}
