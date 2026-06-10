const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SRC = '/Users/mr.maqa/Downloads/magaza excellər/Məhsular cəm.xlsx';
const DEST = '/tmp/avito-magaza-import.xlsx';
const LIMIT = 100;

// Title-dan kateqoriya təxmini
function detectCategory(title) {
  const t = title.toLowerCase();
  if (/avtomobil|maşın|fm ötürücü|gps|car|park|şin|disk/.test(t)) return 'ehtiyat';
  if (/telefon|smartfon|iphone|samsung|xiaomi|huawei|honor|smart phone/.test(t)) return 'telefon';
  if (/qulaqcıq|qulaq|airpods|bluetooth|simsiz/.test(t)) return 'elektronika';
  if (/saat|smartwatch|smart watch|fitness/.test(t)) return 'elektronika';
  if (/kompüter|noutbuk|laptop|monitor|klaviatura|maus|mouse/.test(t)) return 'kompyuter';
  if (/tv|televiz|monitor/.test(t)) return 'tv';
  if (/kamera|camera|dron|drone|gopro/.test(t)) return 'elektronika';
  if (/şarj|adapter|kabel|cable|powerbank|akkumulyator/.test(t)) return 'elektronika';
  if (/yataq|stol|stul|divan|gardrop|mebel/.test(t)) return 'ev-ve-bag';
  if (/ütü|paltaryuyan|soyuducu|mətbəx|qab|qazan/.test(t)) return 'ev-ve-bag';
  if (/oyun|oyuncaq|uşaq|baby|child/.test(t)) return 'usaq';
  if (/geyim|köynək|şalvar|paltar|ayaqqabı/.test(t)) return 'geyim';
  return 'elektronika'; // default
}

// Brend təxmini (Əsas Satıcı dəyərindən və ya title-dan)
function detectBrand(title, satici) {
  const all = `${title} ${satici}`.toLowerCase();
  const brands = ['Apple','Samsung','Xiaomi','Huawei','Honor','Anker','JBL','Sony','LG','Bosch','Philips','Awei','Hoco','Borofone','Baseus','Ugreen','Beko','Toshiba'];
  for (const b of brands) {
    if (all.includes(b.toLowerCase())) return b;
  }
  return 'Digər';
}

// Image — Picsum random ilə (test üçün)
function genImage(id) {
  return `https://picsum.photos/seed/avito${id}/600/600`;
}

const wb = XLSX.readFile(SRC);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log(`Mənbədə ${rows.length} məhsul`);

// İlk LIMIT məhsul, status='Aktiv', qiyməti var olanlar
const filtered = rows
  .filter(r => String(r.Status).toLowerCase() === 'aktiv')
  .filter(r => Number(r.Qiyməti) > 0)
  .slice(0, LIMIT);

console.log(`Filtrli: ${filtered.length} məhsul`);

const exported = filtered.map((r, i) => {
  const title = String(r['Məhsulun Adı']).trim().slice(0, 119);
  const price = Number(r.Qiyməti);
  const oldPrice = Number(r['Köhnə Qiyməti']) || null;
  const qty = Number(r.Miqdar) || 0;
  const satici = String(r['Əsas Satıcı'] || '');
  const mpn = String(r.MPN || '');

  const description = `${title}\n\nBrend: ${detectBrand(title, satici)}\nKod: ${mpn || 'N/A'}\nMiqdar anbarda: ${qty} ədəd\nVəziyyət: Yeni\n${oldPrice ? `\nKöhnə qiymət: ${oldPrice} AZN, indi: ${price} AZN — endirim!` : ''}\n\nSatıcı: ${satici}\nÇatdırılma: Bakı və regionlar üzrə.`.slice(0, 2000);

  return {
    title,
    description,
    category: detectCategory(title),
    city: 'baki',
    price,
    currency: 'AZN',
    condition: 'new',
    contact_phone: '+994501234567',
    has_delivery: 'true',
    has_credit: oldPrice ? 'true' : 'false',
    image_urls: genImage(r.ID || i),
    attr_brand: detectBrand(title, satici),
  };
});

// Yaz
const outWb = XLSX.utils.book_new();
const outWs = XLSX.utils.json_to_sheet(exported);
XLSX.utils.book_append_sheet(outWb, outWs, 'Listings');
XLSX.writeFile(outWb, DEST);
console.log(`✓ Hazır: ${DEST} (${exported.length} sətir)`);

// Top 5 nümunə
console.log('\nİlk 3 sətir:');
exported.slice(0, 3).forEach((e, i) => {
  console.log(`${i+1}. ${e.title} → ${e.category} (${e.attr_brand}) — ${e.price} ${e.currency}`);
});
