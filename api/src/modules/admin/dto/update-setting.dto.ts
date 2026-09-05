import { IsDefined } from 'class-validator';

/**
 * NİYƏ `unknown`: `PlatformSetting.value` Json-dur, açarlar zamanla boolean-dan
 * rəqəmə (məs. limit astanası) çevrilə bilər. Ona görə tip DTO-da deyil, servisdə
 * açarın DEFOLT dəyərinin tipi ilə tutuşdurulur — yeni açar əlavə edəndə burada
 * heç nə dəyişmir, yanlış tip isə yenə də 400 qaytarır.
 */
export class UpdateSettingDto {
  @IsDefined({ message: '`value` sahəsi tələb olunur' })
  value!: unknown;
}
