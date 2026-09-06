/**
 * KATEQORİYA GÖRÜNÜŞÜ VƏ SAYĞACLARININ SİNXRONİZASİYASI
 *
 * İKİ İŞ GÖRÜR:
 *  1. `listings_count` sütununu YENİDƏN HESABLAYIR. Bu sütun denormallaşdırılmışdır və
 *     toplu idxal/silmə ondan xəbərsiz baş verir — nəticədə kateqoriya plitələrində
 *     yanlış rəqəm görünür (məs. «Daşınmaz əmlak 9» yazılır, açanda 0 elan çıxır).
 *  2. `--hide-empty` verilərsə, alt ağacında bir dənə də aktiv elanı olmayan
 *     kateqoriyanı `is_active = false` edir.
 *
 * ⚠️ `--hide-empty` DEFOLT SÖNÜLÜDÜR VƏ ADƏTƏN İSTƏNİLMİR. Səbəb ölçüldü:
 * `/categories` ağacını HƏM kataloq menyusu, HƏM DƏ elan yerləşdirmə səhifəsi
 * işlədir (`frontend/app/elan-yerlesdir/page.tsx:162` → `api('/categories')`,
 * backend `categories.service.ts:45` → `where: { isActive: true }`).
 * Yəni boş kateqoriyanı gizlətmək istifadəçinin ora elan YERLƏŞDİRMƏSİNİ də
 * bağlayır — kateqoriya heç vaxt dolmur, gizli qalır, KİLİD yaranır. Bu ölçüdə
 * (117 kateqoriyadan 90-ı) marketplace faktiki olaraq tək vertikala daralardı.
 * Boş kateqoriyanı istifadəçiyə göstərməmək BAXIŞ (browse) qatının işidir:
 * plitələr `listingsCount === 0` olanı gizlədir, elan yerləşdirmə isə tam ağacı görür.
 *
 * NİYƏ ALT AĞAC: valideynin öz elanı olmaya bilər, amma uşaqlarında ola bilər
 * («Elektronika» birbaşa 0, altındakı «Audio sistemlər» 535). Sadə birbaşa sayım
 * bütün kök kateqoriyaları gizlədərdi.
 *
 * İSTİFADƏ:
 *   npx tsx scripts/sync-category-visibility.ts             # yalnız hesabat
 *   npx tsx scripts/sync-category-visibility.ts --confirm   # tətbiq edir
 */
import { PrismaService } from '../src/prisma/prisma.service';

type Row = { id: string; slug: string; parentId: string | null; isActive: boolean; listingsCount: number };

async function main(): Promise<void> {
  const confirm = process.argv.includes('--confirm');
  const hideEmpty = process.argv.includes('--hide-empty');
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const cats: Row[] = await prisma.category.findMany({
      select: { id: true, slug: true, parentId: true, isActive: true, listingsCount: true },
    });

    // Birbaşa (öz kateqoriyasına bağlı) aktiv elan sayı.
    const grouped = await prisma.listing.groupBy({
      by: ['categoryId'],
      where: { status: 'active' },
      _count: { _all: true },
    });
    const direct = new Map<string, number>();
    for (const g of grouped) if (g.categoryId) direct.set(g.categoryId, g._count._all);

    // Alt ağac cəmi: uşaqdan valideynə doğru toplayırıq.
    const children = new Map<string | null, Row[]>();
    for (const c of cats) {
      const list = children.get(c.parentId) ?? [];
      list.push(c);
      children.set(c.parentId, list);
    }
    const subtree = new Map<string, number>();
    const compute = (c: Row): number => {
      const own = direct.get(c.id) ?? 0;
      const kids = (children.get(c.id) ?? []).reduce((s, k) => s + compute(k), 0);
      const total = own + kids;
      subtree.set(c.id, total);
      return total;
    };
    for (const root of children.get(null) ?? []) compute(root);

    const countChanges = cats.filter((c) => (subtree.get(c.id) ?? 0) !== c.listingsCount);
    const toHide = hideEmpty ? cats.filter((c) => c.isActive && (subtree.get(c.id) ?? 0) === 0) : [];
    const toShow = cats.filter((c) => !c.isActive && (subtree.get(c.id) ?? 0) > 0);

    console.log(`Kateqoriya: ${cats.length}`);
    console.log(`Sayğacı köhnəlmiş: ${countChanges.length}`);
    console.log(
      hideEmpty
        ? `GİZLƏDİLƏCƏK (alt ağacda 0 aktiv elan): ${toHide.length}`
        : 'Gizlətmə SÖNÜLÜDÜR (--hide-empty verilməyib) — elan yerləşdirmə ağacı toxunulmaz qalır',
    );
    for (const c of toHide.slice(0, 20)) console.log(`   − ${c.slug}`);
    if (toHide.length > 20) console.log(`   ... və daha ${toHide.length - 20}`);
    console.log(`GERİ AÇILACAQ: ${toShow.length}`);
    for (const c of toShow.slice(0, 20)) console.log(`   + ${c.slug} (${subtree.get(c.id)})`);

    if (!confirm) {
      console.log('\nHEÇ NƏ DƏYİŞMƏDİ. Tətbiq üçün: --confirm');
      return;
    }

    let updated = 0;
    for (const c of cats) {
      const total = subtree.get(c.id) ?? 0;
      const nextActive = hideEmpty ? total > 0 : c.isActive || total > 0;
      if (c.listingsCount === total && c.isActive === nextActive) continue;
      await prisma.category.update({
        where: { id: c.id },
        data: { listingsCount: total, isActive: nextActive },
      });
      updated++;
    }
    console.log(`\nYENİLƏNDİ: ${updated} kateqoriya`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
