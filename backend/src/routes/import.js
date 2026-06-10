import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { query, pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { makeSlug } from '../utils/slug.js';

const router = Router();

// Memory storage — fayl disk-ə yazılmadan emal olunur
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/**
 * Excel/CSV format (sütunlar):
 *   title       (məcburi)
 *   description (məcburi)
 *   category    (slug, məcburi)  — məs: telefon, avtomobil
 *   city        (slug, opsional) — məs: baki
 *   price       (rəqəm, opsional)
 *   currency    (AZN/USD/EUR)
 *   condition   (new/like_new/used)
 *   contact_phone
 *   image_urls  (vergüllə ayrılmış URL siyahı)
 *   has_delivery (true/false)
 *   has_credit  (true/false)
 *
 * Atributlar — kateqoriyaya görə dinamik sütun adları:
 *   attr_brand, attr_year, attr_rooms, attr_storage və s.
 */

const REQUIRED = ['title', 'description', 'category'];

router.get('/template', authRequired, (_req, res) => {
  // Şablon — istifadəçi yükləyir
  const wb = XLSX.utils.book_new();
  const data = [
    ['title', 'description', 'category', 'city', 'price', 'currency', 'condition',
     'contact_phone', 'has_delivery', 'has_credit', 'image_urls',
     'attr_brand', 'attr_storage', 'attr_year', 'attr_rooms', 'attr_area'],
    ['iPhone 15 Pro 256GB', 'Yenidir, qutusu var, zəmanəti aktiv', 'telefon', 'baki', 1850, 'AZN', 'new',
     '+994501234567', 'true', 'false',
     'https://images.unsplash.com/photo-1592750475338-74b7b21085ab',
     'Apple', '256', '', '', ''],
    ['BMW X5 2020', 'Birinci sahibi, salondan alınıb', 'avtomobil', 'baki', 78000, 'AZN', 'like_new',
     '+994551234567', 'false', 'true',
     'https://images.unsplash.com/photo-1555215695-3004980ad54e',
     'BMW', '', '2020', '', ''],
    ['3 otaqlı mənzil Yasamal', '110 m² yeni tikili 5/16', 'menzil-satilir', 'baki', 215000, 'AZN', '',
     '+994701234567', 'false', 'true',
     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
     '', '', '', '3', '110'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Listings');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="avito-import-template.xlsx"');
  res.send(buf);
});

router.post('/listings', authRequired, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl tələb olunur' });
  const dryRun = req.query.dry_run === 'true' || req.body.dry_run === 'true';

  try {
    let rows;
    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } catch (e) {
      return res.status(400).json({ error: `Fayl oxunmadı: ${e.message}` });
    }

    if (!rows.length) {
      return res.status(400).json({ error: 'Fayl boşdur' });
    }

    // Kateqoriya və şəhər lookup-ları
    const categories = await query(`SELECT id, slug FROM categories`);
    const cities = await query(`SELECT id, slug FROM cities`);
    const catMap = new Map(categories.rows.map((c) => [c.slug, c.id]));
    const cityMap = new Map(cities.rows.map((c) => [c.slug, c.id]));

    const errors = [];
    const valid = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // header + 1-based

      // Required check
      for (const k of REQUIRED) {
        if (!String(r[k] ?? '').trim()) {
          errors.push({ row: rowNum, field: k, message: `${k} məcburidir` });
        }
      }
      if (errors.some((e) => e.row === rowNum)) continue;

      const categoryId = catMap.get(String(r.category).trim().toLowerCase());
      if (!categoryId) {
        errors.push({ row: rowNum, field: 'category', message: `Kateqoriya tapılmadı: ${r.category}` });
        continue;
      }

      const cityId = r.city ? cityMap.get(String(r.city).trim().toLowerCase()) : null;
      if (r.city && !cityId) {
        errors.push({ row: rowNum, field: 'city', message: `Şəhər tapılmadı: ${r.city}` });
        continue;
      }

      // Atributlar
      const attributes = {};
      for (const [k, v] of Object.entries(r)) {
        if (k.startsWith('attr_') && v !== '' && v != null) {
          const key = k.replace(/^attr_/, '');
          // rəqəm convert et
          attributes[key] = !isNaN(Number(v)) && String(v).trim() !== '' ? Number(v) : String(v);
        }
      }

      const title = String(r.title).trim();
      const description = String(r.description).trim();

      if (title.length < 5) {
        errors.push({ row: rowNum, field: 'title', message: 'Başlıq min 5 simvol' });
        continue;
      }
      if (description.length < 10) {
        errors.push({ row: rowNum, field: 'description', message: 'Təsvir min 10 simvol' });
        continue;
      }

      const images = String(r.image_urls || '')
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http'));

      valid.push({
        title, description, category_id: categoryId, city_id: cityId,
        price: r.price !== '' ? Number(r.price) : null,
        currency: String(r.currency || 'AZN').toUpperCase().slice(0, 3),
        condition: r.condition ? String(r.condition).trim() : null,
        contact_phone: r.contact_phone ? String(r.contact_phone) : null,
        has_delivery: parseBool(r.has_delivery),
        has_credit: parseBool(r.has_credit),
        attributes,
        images,
      });
    }

    if (dryRun) {
      return res.json({
        ok: true,
        valid_count: valid.length,
        error_count: errors.length,
        errors: errors.slice(0, 50),
        sample: valid.slice(0, 3),
      });
    }

    // İnsert
    const client = await pool.connect();
    let inserted = 0;
    try {
      await client.query('BEGIN');
      for (const v of valid) {
        const slug = `${makeSlug(v.title)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const ins = await client.query(
          `INSERT INTO listings (
             owner_id, category_id, city_id, title, slug, description,
             price, currency, price_type, condition, attributes,
             contact_phone, has_delivery, has_credit, status
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'fixed',$9,$10,$11,$12,$13,'active')
           RETURNING id`,
          [req.user.sub, v.category_id, v.city_id, v.title, slug, v.description,
           v.price, v.currency, v.condition,
           JSON.stringify(v.attributes), v.contact_phone, v.has_delivery, v.has_credit]
        );
        const listingId = ins.rows[0].id;
        for (let i = 0; i < v.images.length; i++) {
          await client.query(
            `INSERT INTO listing_media (listing_id, url, sort_order) VALUES ($1, $2, $3)`,
            [listingId, v.images[i], i]
          );
        }
        inserted++;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    res.json({ ok: true, inserted, error_count: errors.length, errors: errors.slice(0, 50) });
  } catch (e) {
    next(e);
  }
});

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'bəli' || s === 'yes';
}

export default router;
