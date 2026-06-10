// 360tap.az — seed (idempotent): regions/districts/nearby + categories + brands
import { PrismaClient } from '@prisma/client';
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

async function seedCategories(): Promise<void> {
  let i = 0;
  for (const root of CATEGORIES) {
    await upsertCategory(root, undefined, i++);
  }
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
    await prisma.listing.create({
      data: {
        ownerId: user.id,
        categoryId: cat.id,
        districtId: dist.id,
        vertical: cat.vertical,
        title: s.title,
        slug: `${makeSlug(s.title)}-${i++}`,
        description: s.description,
        price: s.price,
        currency: 'AZN',
        status: 'active',
        source: 'manual',
        isVip: s.isVip ?? false,
        isPremium: s.isPremium ?? false,
        hasDelivery: s.hasDelivery ?? false,
        attributes: s.attributes ?? {},
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      },
    });
    created++;
  }
  console.log(`  listings: ${created} nümunə aktiv elan (demo satıcı)`);
}

async function main(): Promise<void> {
  console.log('🌱 Seed başladı...');
  await seedGeo();
  await seedCategories();
  await seedBrands();
  await seedListings();
  console.log('✅ Seed tamam.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
