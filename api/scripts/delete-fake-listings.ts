/**
 * SAXTA (NÜMUNƏ) ELANLARIN SİLİNMƏSİ
 *
 * NİYƏ: canlı kataloqun HAMISI saxta idi — ölçüldü (2026-09-06,
 * `GET https://360tap.az/api/listings`, 115/115):
 *   · tək sahib (bir `ownerId`), · `contactName = "Demo Satıcı"`,
 *   · `contactPhone = "+994501112233"`, · hər başlıq «— nümunə elan» ilə bitir.
 * `is_demo` sütunu canlıda HEÇ BİR sətirdə qoyulmayıb (həmin miqrasiya icra
 * olunmayıb — DAVAM.md §4.2-c), ona görə yalnız `is_demo`-ya baxmaq canlıda
 * SIFIR sətir tapardı. Meyarlar məhz buna görə çoxqatlıdır.
 *
 * TƏHLÜKƏSİZLİK QAYDALARI:
 *  · Standart rejim yalnız HESABAT verir; silmək üçün `--confirm` lazımdır.
 *  · Silinəcək sətirlərin sayı və nümunəsi ƏVVƏLCƏDƏN göstərilir.
 *  · Real mağazaya (`store_id` dolu) bağlı elanlar HEÇ VAXT silinmir — idxal
 *    olunmuş kataloq təsadüfən qurban getməsin.
 *  · Bağlı sətirlər (şəkil, favorit, söhbət, atribut) sxemdə `onDelete: Cascade`-dir,
 *    yəni orfan qalmır (schema.prisma:358,373,392,420,443,538,552).
 *
 * İSTİFADƏ:
 *   npx tsx scripts/delete-fake-listings.ts                  # yalnız hesabat
 *   npx tsx scripts/delete-fake-listings.ts --confirm        # SİLİR
 *   DATABASE_URL='<render>' npx tsx scripts/delete-fake-listings.ts --confirm
 */
import { PrismaService } from '../src/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

/** «Nümunə elan» başlıq nişanı — seed-in özü bu sonluğu yazır. */
const DEMO_TITLE_SUFFIX = 'nümunə elan';
const DEMO_PHONE = '+994501112233';
const DEMO_CONTACT = 'Demo Satıcı';
const DEMO_EMAILS = ['demo@360tap.az'];

function whereFake(demoOwnerIds: string[]): Prisma.ListingWhereInput {
  return {
    // Mağazaya bağlı elanlar toxunulmazdır — onlar real kataloqdur.
    storeId: null,
    OR: [
      { isDemo: true },
      { title: { endsWith: DEMO_TITLE_SUFFIX } },
      { contactPhone: DEMO_PHONE },
      { contactName: DEMO_CONTACT },
      ...(demoOwnerIds.length ? [{ ownerId: { in: demoOwnerIds } }] : []),
    ],
  };
}

async function main(): Promise<void> {
  const confirm = process.argv.includes('--confirm');
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const demoOwners = await prisma.user.findMany({
      where: { email: { in: DEMO_EMAILS } },
      select: { id: true, email: true },
    });
    const where = whereFake(demoOwners.map((u) => u.id));

    const total = await prisma.listing.count();
    const victims = await prisma.listing.findMany({
      where,
      select: { id: true, title: true, contactName: true, isDemo: true },
      take: 10_000,
    });
    const protectedCount = await prisma.listing.count({ where: { storeId: { not: null } } });

    console.log(`Bazadakı elan: ${total}`);
    console.log(`Demo sahib hesabları: ${demoOwners.map((u) => u.email).join(', ') || '(yoxdur)'}`);
    console.log(`Mağazaya bağlı (TOXUNULMUR): ${protectedCount}`);
    console.log(`SAXTA sayılan: ${victims.length}`);
    for (const v of victims.slice(0, 8)) {
      console.log(`   · ${v.title.slice(0, 58)}  [contact: ${v.contactName ?? '-'}, isDemo: ${v.isDemo}]`);
    }
    if (victims.length > 8) console.log(`   ... və daha ${victims.length - 8}`);

    if (!confirm) {
      console.log('\nHEÇ NƏ SİLİNMƏDİ. Silmək üçün: --confirm');
      return;
    }

    const res = await prisma.listing.deleteMany({ where });
    const after = await prisma.listing.count();
    console.log(`\nSİLİNDİ: ${res.count} · qalan elan: ${after}`);
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
