import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PLATFORMA AYARLARI — MONETİZASİYANIN AÇARI.
 *
 * NİYƏ BELƏ: qiymət/limit siyasəti biznes qərarıdır. Onu env dəyişəni etsək,
 * hər dəyişiklik üçün deploy gözləmək lazım gələr; kodda sabit yazsaq, ümumiyyətlə
 * dəyişdirmək olmaz. Ona görə dəyərlər bazadadır və admin panelindən idarə olunur.
 *
 * NİYƏ KEŞ: bu bayraqlar elan yaratma kimi isti yollarda oxunur. Hər sorğuda DB-yə
 * getmək mənasızdır — dəyərlər nadir dəyişir. 30 saniyəlik keş kifayətdir: admin
 * düyməni basandan sonra ən geci yarım dəqiqəyə bütün instanslarda qüvvəyə minir,
 * özü isə `invalidate()` ilə dərhal təmizlənir.
 *
 * NİYƏ DEFOLTLAR SÖNÜLÜDÜR: platformada trafik yoxdur. Boş marketpleysdə pulsuz
 * limit qoymaq və ya pul tələb etmək tədarükü öldürür (Taobao eBay China-nı məhz
 * pulsuz elanla üstələdi; Vinted satıcı haqlarını ləğv edəndən sonra böyüdü).
 * Təməl hazır dayanır, astana keçiləndə admin bir düymə ilə açır.
 */

/** Bilinən açarlar — admin paneli bu siyahını göstərir, sərbəst açar qəbul edilmir. */
export const SETTING_DEFS = [
  {
    key: 'monetization.enabled',
    label: 'Monetizasiya (ümumi açar)',
    hint: 'Bağlı olduqda bütün ödənişli funksiyalar gizlənir və heç bir limit tətbiq olunmur.',
    default: false,
  },
  {
    key: 'listing_limits.enabled',
    label: 'Pulsuz elan limitləri',
    hint: 'Rəqiblərin əsas monetizasiya leveri. Bağlı olduqda limit HESABLANIR və statistikada görünür, amma heç kimi bloklamır.',
    default: false,
  },
  {
    key: 'packages.enabled',
    label: 'Paket satışı',
    hint: 'Mağazalar üçün paket vitrini. Bağlı olduqda paketlər yalnız admin panelində görünür.',
    default: false,
  },
  {
    key: 'promotions.enabled',
    label: 'Ödənişli irəli çəkmə (VIP/Premium)',
    hint: 'Elan sahibinə ödənişli görünürlük xidmətləri təklif edilsin.',
    default: false,
  },
  {
    key: 'store.auto_approve',
    label: 'Mağazanı avtomatik təsdiqlə',
    hint: 'Açıq olduqda yeni mağaza dərhal aktiv olur. Bağlı olduqda admin təsdiqi gözlənilir.',
    default: true,
  },
  {
    key: 'store.free_registration',
    label: 'Mağaza qeydiyyatı pulsuzdur',
    hint: 'Bağlı olduqda mağaza açmaq üçün aktiv paket tələb olunur (tap.az modeli).',
    default: true,
  },
] as const;

export type SettingKey = (typeof SETTING_DEFS)[number]['key'];

const CACHE_TTL_MS = 30_000;

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger('Settings');
  private cache = new Map<string, unknown>();
  private expiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Startup-da çatışmayan açarlar defolt dəyərlə yaradılır ki, admin paneli
   * boş siyahı göstərməsin. Mövcud dəyərlərə TOXUNULMUR — operatorun seçimi
   * hər deploy-da sıfırlanmamalıdır.
   */
  async onModuleInit(): Promise<void> {
    try {
      for (const def of SETTING_DEFS) {
        await this.prisma.platformSetting.upsert({
          where: { key: def.key },
          update: { label: def.label },
          create: { key: def.key, value: def.default as never, label: def.label },
        });
      }
    } catch (e) {
      // Faza 0 prinsipi: opsional infrastruktur startup-u bloklamamalıdır.
      // Ayarlar oxunmasa da defolt dəyərlər işləyir (hamısı sönülü).
      this.logger.warn(`Ayarlar hazırlana bilmədi, defoltlar işlədilir: ${String(e)}`);
    }
  }

  private async load(): Promise<Map<string, unknown>> {
    if (Date.now() < this.expiresAt) return this.cache;
    try {
      const rows = await this.prisma.platformSetting.findMany();
      this.cache = new Map(rows.map((r) => [r.key, r.value]));
    } catch {
      // DB əlçatmazdırsa köhnə keşlə davam et — elan yaratma axını çökməməlidir.
    }
    this.expiresAt = Date.now() + CACHE_TTL_MS;
    return this.cache;
  }

  /** Bayraq oxunuşu. Naməlum/oxunmayan açar üçün defolt qaytarılır. */
  async isEnabled(key: SettingKey): Promise<boolean> {
    const def = SETTING_DEFS.find((d) => d.key === key);
    const map = await this.load();
    const v = map.get(key);
    return typeof v === 'boolean' ? v : (def?.default ?? false);
  }

  /**
   * Monetizasiya ilə bağlı bayraqlar İKİQAT şərtlidir: ümumi açar bağlıdırsa,
   * ayrıca bayraq açıq olsa belə funksiya işləmir. Bu, «hər şeyi bir düymə ilə
   * söndür» imkanı verir — insident zamanı vacibdir.
   */
  async isMonetizedFeatureEnabled(key: SettingKey): Promise<boolean> {
    if (!(await this.isEnabled('monetization.enabled'))) return false;
    return this.isEnabled(key);
  }

  async all(): Promise<{ key: string; value: unknown; label: string; hint: string }[]> {
    const map = await this.load();
    return SETTING_DEFS.map((d) => ({
      key: d.key,
      value: map.has(d.key) ? map.get(d.key) : d.default,
      label: d.label,
      hint: d.hint,
    }));
  }

  async set(key: string, value: unknown, updatedBy?: string): Promise<void> {
    const def = SETTING_DEFS.find((d) => d.key === key);
    if (!def) throw new Error(`Naməlum ayar açarı: ${key}`);
    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value: value as never, updatedBy: updatedBy ?? null },
      create: { key, value: value as never, label: def.label, updatedBy: updatedBy ?? null },
    });
    this.invalidate();
    this.logger.log(`Ayar dəyişdi: ${key} = ${JSON.stringify(value)}`);
  }

  /** Dəyişiklikdən sonra keşi dərhal təmizləyir. */
  invalidate(): void {
    this.expiresAt = 0;
  }
}
