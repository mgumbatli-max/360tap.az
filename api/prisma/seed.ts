// 360tap.az — seed (idempotent): regions/districts/nearby + categories + brands
import { Prisma, PrismaClient } from '@prisma/client';
import { REGIONS } from './seed/regions';
import { CATEGORIES, type SeedCategory } from './seed/categories';
import { VEHICLE_BRANDS } from './seed/brands';
import { DEMO_SELLER, SAMPLE_LISTINGS } from './seed/listings';
import { buildNearby } from './seed/haversine';
import { makeSlug } from '../src/modules/listings/utils/slug.util';

const prisma = new PrismaClient();
const DEMO_PWD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c2VlZA$seed-demo-no-login';

async function seedGeo(): Promise<void> {
  for (const r of REGIONS) {
    const region = await prisma.region.upsert({
      where: { slug: r.slug },
      update: { nameAz: r.nameAz, nameRu: r.nameRu, lat: r.lat, lng: r.lng, sortOrder: r.sortOrder },
      create: { slug: r.slug, nameAz: r.nameAz, nameRu: r.nameRu, lat: r.lat, lng: r.lng, sortOrder: r.sortOrder },
    });
    for (const d of r.districts) {
      await prisma.district.upsert({
        where: { slug: d.slug },
        update: { nameAz: d.nameAz, lat: d.lat, lng: d.lng, regionId: region.id },
        create: { slug: d.slug, nameAz: d.nameAz, lat: d.lat, lng: d.lng, regionId: region.id },
      });
    }
  }
  const districts = await prisma.district.findMany({ select: { id: true, lat: true, lng: true } });
  const valid = districts.filter(
    (d): d is { id: string; lat: number; lng: number } => d.lat !== null && d.lng !== null,
  );
  const rows = buildNearby(valid, 6, 150);
  await prisma.nearbyDistrict.deleteMany({});
  if (rows.length) await prisma.nearbyDistrict.createMany({ data: rows });
  console.log(`  geo: ${REGIONS.length} region, ${districts.length} rayon, ${rows.length} nearby`);
}

async function upsertCategory(c: SeedCategory, parentId: string | undefined, sortOrder: number): Promise<void> {
  const cat = await prisma.category.upsert({
    where: { slug: c.slug },
    update: { nameAz: c.nameAz, vertical: c.vertical, icon: c.icon, parentId, sortOrder },
    create: { slug: c.slug, nameAz: c.nameAz, vertical: c.vertical, icon: c.icon, parentId, sortOrder },
  });
  let ai = 0;
  for (const a of c.attributes ?? []) {
    await prisma.categoryAttribute.upsert({
      where: { categoryId_key: { categoryId: cat.id, key: a.key } },
      update: {
        labelAz: a.labelAz, type: a.type, options: a.options ?? undefined, unit: a.unit,
        isFilterable: a.isFilterable ?? true, isSearchable: a.isSearchable ?? false,
        isRequired: a.isRequired ?? false, sortOrder: ai,
      },
      create: {
        categoryId: cat.id, key: a.key, labelAz: a.labelAz, type: a.type, options: a.options ?? undefined,
        unit: a.unit, isFilterable: a.isFilterable ?? true, isSearchable: a.isSearchable ?? false,
        isRequired: a.isRequired ?? false, sortOrder: ai,
      },
    });
    ai++;
  }
  let ci = 0;
  for (const child of c.children ?? []) {
    await upsertCategory(child, cat.id, ci++);
  }
}

function collectSlugs(cats: SeedCategory[], acc: string[] = []): string[] {
  for (const cat of cats) {
    acc.push(cat.slug);
    if (cat.children) collectSlugs(cat.children, acc);
  }
  return acc;
}

async function seedCategories(): Promise<void> {
  let i = 0;
  for (const root of CATEGORIES) {
    await upsertCategory(root, undefined, i++);
  }
  // Köhnə/orfan kateqoriyaları təmizlə (yalnız elanı və alt-kateqoriyası olmayanları)
  const keep = collectSlugs(CATEGORIES);
  await prisma.category.deleteMany({
    where: { slug: { notIn: keep }, listings: { none: {} }, children: { none: {} } },
  });
  console.log(`  categories: ${await prisma.category.count()} cəmi`);
}

async function seedBrands(): Promise<void> {
  const slugifyModel = (s: string): string =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  for (const b of VEHICLE_BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, vertical: 'transport' },
      create: { slug: b.slug, name: b.name, vertical: 'transport' },
    });
    for (const m of b.models) {
      const mslug = slugifyModel(m);
      await prisma.vehicleModel.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: mslug } },
        update: { name: m },
        create: { brandId: brand.id, slug: mslug, name: m },
      });
    }
  }
  console.log(`  brands: ${VEHICLE_BRANDS.length} brend`);
}

async function seedListings(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_SELLER.email },
    update: {},
    create: { email: DEMO_SELLER.email, fullName: DEMO_SELLER.fullName, passwordHash: DEMO_PWD_HASH },
  });
  // Idempotent: demo satıcının köhnə elanlarını sil
  await prisma.listing.deleteMany({ where: { ownerId: user.id } });

  let i = 0;
  let created = 0;
  for (const s of SAMPLE_LISTINGS) {
    const cat = await prisma.category.findUnique({
      where: { slug: s.categorySlug },
      select: { id: true, vertical: true },
    });
    const dist = await prisma.district.findUnique({
      where: { slug: s.districtSlug },
      select: { id: true },
    });
    if (!cat || !dist) continue;
    const slug = `${makeSlug(s.title)}-${i++}`;
    const listing = await prisma.listing.create({
      data: {
        ownerId: user.id,
        categoryId: cat.id,
        districtId: dist.id,
        vertical: cat.vertical,
        title: s.title,
        slug,
        description: s.description,
        price: s.price > 0 ? s.price : null,
        priceType: s.price > 0 ? 'fixed' : 'negotiable',
        currency: 'AZN',
        status: 'active',
        source: 'manual',
        isVip: s.isVip ?? false,
        isPremium: s.isPremium ?? false,
        hasDelivery: s.hasDelivery ?? false,
        attributes: (s.attributes ?? {}) as Prisma.InputJsonValue,
        contactName: DEMO_SELLER.fullName,
        contactPhone: '+994501112233',
        contactWhatsapp: true,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      },
    });
    // Deterministik nümunə şəkillər (boş marketplace olmasın)
    await prisma.listingImage.createMany({
      data: [0, 1, 2].map((n) => ({
        listingId: listing.id,
        url: `https://picsum.photos/seed/${slug}-${n}/600/450`,
        width: 600,
        height: 450,
        sortOrder: n,
      })),
    });
    created++;
  }
  console.log(`  listings: ${created} nümunə aktiv elan (demo satıcı)`);
}

// Boş qalan hər leaf kateqoriyaya 1 nümunə elan (hər bölmə dolu olsun)
async function seedFillEmptyCategories(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_SELLER.email },
    select: { id: true },
  });
  if (!user) return;
  const leaves = await prisma.category.findMany({
    where: { isActive: true, children: { none: {} } },
    select: { id: true, nameAz: true, vertical: true },
    orderBy: { sortOrder: 'asc' },
  });
  const districts = await prisma.district.findMany({ select: { id: true }, take: 40 });
  if (!districts.length) return;
  let filled = 0;
  let idx = 0;
  for (const cat of leaves) {
    const count = await prisma.listing.count({ where: { categoryId: cat.id } });
    if (count > 0) {
      idx++;
      continue;
    }
    const dist = districts[idx % districts.length];
    const slug = `${makeSlug(cat.nameAz)}-numune-${idx}`;
    const isJob = cat.vertical === 'job';
    const listing = await prisma.listing.create({
      data: {
        ownerId: user.id,
        categoryId: cat.id,
        districtId: dist.id,
        vertical: cat.vertical,
        title: `${cat.nameAz} — nümunə elan`,
        slug,
        description: `${cat.nameAz} kateqoriyasında nümunə elan. Ətraflı məlumat üçün satıcı ilə əlaqə saxlayın.`,
        price: isJob ? null : 50 + (idx % 20) * 25,
        priceType: isJob ? 'negotiable' : 'fixed',
        currency: 'AZN',
        status: 'active',
        source: 'manual',
        contactName: DEMO_SELLER.fullName,
        contactPhone: '+994501112233',
        contactWhatsapp: true,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      },
    });
    await prisma.listingImage.createMany({
      data: [0, 1].map((n) => ({
        listingId: listing.id,
        url: `https://picsum.photos/seed/${slug}-${n}/600/450`,
        width: 600,
        height: 450,
        sortOrder: n,
      })),
    });
    filled++;
    idx++;
  }
  console.log(`  fill empty categories: ${filled} əlavə`);
}

// Kateqoriya listingsCount (alt-ağac daxil) hesabla və yenilə
async function seedCategoryCounts(): Promise<void> {
  const cats = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const grouped = await prisma.listing.groupBy({
    by: ['categoryId'],
    where: { status: 'active' },
    _count: true,
  });
  const direct = new Map(grouped.map((g) => [g.categoryId, g._count]));
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c.id);
      childrenOf.set(c.parentId, arr);
    }
  }
  const total = new Map<string, number>();
  const compute = (id: string): number => {
    if (total.has(id)) return total.get(id)!;
    let sum = direct.get(id) ?? 0;
    for (const ch of childrenOf.get(id) ?? []) sum += compute(ch);
    total.set(id, sum);
    return sum;
  };
  for (const c of cats) compute(c.id);
  for (const [id, count] of total) {
    await prisma.category.update({ where: { id }, data: { listingsCount: count } });
  }
  console.log(`  category counts: yeniləndi`);
}

// Canlı e2e/QA testlərindən qalan test elanlarını təmizlə (marketplace təmiz qalsın).
// Pattern-lər avtomatik test artefaktlarıdır — demo/real elan başlıqları ilə üst-üstə düşmür.
async function cleanupTestData(): Promise<void> {
  const patterns = ['notification axini', 'chat test', 'avto-dərc', 'e2e test'];
  const res = await prisma.listing.deleteMany({
    where: { OR: patterns.map((p) => ({ title: { contains: p, mode: 'insensitive' as const } })) },
  });
  if (res.count) console.log(`  cleanup: ${res.count} test elan silindi`);
}

/**
 * Faza 0 təhlükəsizlik düzəlişi — DEMO ELANLAR ARTIQ OPT-IN-dir.
 *
 * Əvvəl `npm run prisma:seed` HƏMİŞƏ ~104 saxta elan yaradırdı:
 *   · seedListings()            → `demo@360tap.az` («Demo Satıcı») + ~46 nümunə elan
 *   · seedFillEmptyCategories() → hər boş leaf kateqoriyaya 1 avtomatik elan (~58)
 *   · hər ikisi picsum.photos placeholder şəkilləri ilə
 *
 * Bu, DEMO/dev mühiti üçün faydalıdır, lakin CANLI marketplace-də zərərlidir
 * (istifadəçi saxta inventar görür, SEO saxta məzmun indeksləyir).
 *
 * İndi:
 *   · Default (production-safe): YALNIZ real data — geo + kateqoriyalar + brendlər.
 *   · Demo elanlar üçün açıq şəkildə: SEED_DEMO_LISTINGS=true
 */
async function main(): Promise<void> {
  const withDemo = process.env.SEED_DEMO_LISTINGS === 'true';
  console.log(`🌱 Seed başladı... (demo elanlar: ${withDemo ? 'BƏLİ' : 'XEYR — yalnız real data'})`);
  await seedGeo();
  await seedCategories();
  await seedBrands();
  if (withDemo) {
    await seedListings();
    await cleanupTestData();
    await seedFillEmptyCategories();
  } else {
    console.log('  demo elanlar atlandı (aktivləşdirmək üçün: SEED_DEMO_LISTINGS=true)');
  }
  await seedCategoryCounts();
  console.log('✅ Seed tamam.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
