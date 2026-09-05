import { savedQueryToDto } from './query-translate';

/**
 * SAXLANMIŞ AXTARIŞIN TƏRCÜMƏSİ — bu testlərin varlıq səbəbi.
 *
 * Frontend saxlanmış axtarışı URL lüğətində saxlayır (`SaveSearchButton.tsx:25`):
 * atribut filtrləri `a_<açar>` prefiksi ilə ayrı-ayrı açarlardır.
 * Backend isə `attrs` adlı TƏK JSON sətri gözləyir (`query-listings.dto.ts:21`).
 *
 * Bu uyğunsuzluq görünmür və səssizcə zərər verir: tərcümə olmasa uyğunlaşdırıcı
 * atribut filtrlərini TAM İTİRƏR və istifadəçi «BMW» axtarışına görə bütün
 * avtomobillər üçün bildiriş alar. Ona görə çevrilmə ayrıca funksiyadır və
 * ayrıca testlə qorunur.
 */
describe('savedQueryToDto', () => {
  it('sadə filtrləri olduğu kimi ötürür', () => {
    const dto = savedQueryToDto({ q: 'telefon', region: 'baki', category: 'elektronika' });
    expect(dto.q).toBe('telefon');
    expect(dto.region).toBe('baki');
    expect(dto.category).toBe('elektronika');
  });

  it('`a_` prefiksli açarları TƏK `attrs` JSON-una yığır', () => {
    const dto = savedQueryToDto({ category: 'avtomobiller', a_brand: 'BMW', a_year: '2020' });
    expect(dto.attrs).toBeDefined();
    expect(JSON.parse(dto.attrs as string)).toEqual({ brand: 'BMW', year: '2020' });
    // Prefiksli açarlar DTO-nun kökündə QALMAMALIDIR — backend onları tanımır.
    expect((dto as Record<string, unknown>).a_brand).toBeUndefined();
  });

  it('atribut yoxdursa `attrs` ümumiyyətlə qoyulmur', () => {
    const dto = savedQueryToDto({ category: 'elektronika' });
    expect(dto.attrs).toBeUndefined();
  });

  it('qiymət hədlərini mətnfən rəqəmə çevirir', () => {
    const dto = savedQueryToDto({ priceMin: '100', priceMax: '5000' });
    expect(dto.priceMin).toBe(100);
    expect(dto.priceMax).toBe(5000);
  });

  it('yararsız qiyməti ötürmür (NaN backend-də 422 verərdi)', () => {
    const dto = savedQueryToDto({ priceMin: 'abc', priceMax: '' });
    expect(dto.priceMin).toBeUndefined();
    expect(dto.priceMax).toBeUndefined();
  });

  it('backend-in tanımadığı açarları ATIR — `condition` axtarış DTO-sunda yoxdur', () => {
    const dto = savedQueryToDto({ category: 'telefonlar', condition: 'new', page: '3', view: 'map' });
    expect((dto as Record<string, unknown>).condition).toBeUndefined();
    expect((dto as Record<string, unknown>).page).toBeUndefined();
    expect((dto as Record<string, unknown>).view).toBeUndefined();
    expect(dto.category).toBe('telefonlar');
  });

  it('boş dəyərləri atır — boş sətir filtri backend-də «hamısı» demək olardı', () => {
    const dto = savedQueryToDto({ q: '', region: 'gence', a_brand: '' });
    expect(dto.q).toBeUndefined();
    expect(dto.region).toBe('gence');
    expect(dto.attrs).toBeUndefined();
  });

  it('boş və ya yararsız girişdə boş obyekt qaytarır, istisna atmır', () => {
    expect(() => savedQueryToDto({})).not.toThrow();
    expect(() => savedQueryToDto(null as never)).not.toThrow();
    expect(savedQueryToDto(null as never)).toEqual({});
  });

  it('massiv/obyekt dəyərləri atır — JSON sütunundan istənilən şey gələ bilər', () => {
    const dirty = { region: ['baki', 'gence'], category: { x: 1 }, q: 'telefon' } as never;
    const dto = savedQueryToDto(dirty);
    expect(dto.q).toBe('telefon');
    expect(dto.region).toBeUndefined();
    expect(dto.category).toBeUndefined();
  });

  it('rəqəm kimi gələn dəyəri də qəbul edir (JSON sütunu tip qorumur)', () => {
    const dto = savedQueryToDto({ priceMin: 250 } as never);
    expect(dto.priceMin).toBe(250);
  });
});
