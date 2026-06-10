import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// === Telefon nömrəsini normallaşdır ===
function normalizePhone(p) {
  let n = String(p || '').replace(/\D/g, '');
  if (n.startsWith('994')) n = '+' + n;
  else if (n.startsWith('0')) n = '+994' + n.slice(1);
  else if (!n.startsWith('+')) n = '+994' + n;
  return n;
}

// === Mock SMS göndərmə (dev-mode log, prod-da real provider) ===
async function sendSms(phone, message) {
  console.log(`[SMS] ${phone} → ${message}`);
  // TODO: Atlas/Twilio inteqrasiya prod üçün
  return { ok: true };
}

const registerSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6).max(100),
  city: z.string().optional(),
}).refine((d) => d.email || d.phone, { message: 'Email və ya telefon tələb olunur' });

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);

    const { rows } = await query(
      `INSERT INTO users (email, phone, password_hash, full_name, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, phone, full_name, role, city, avatar_url, rating, reviews_count, created_at`,
      [data.email || null, data.phone || null, hash, data.full_name, data.city || null]
    );
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Bu email və ya telefon artıq qeydiyyatdan keçib' });
    }
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const isEmail = identifier.includes('@');
    const { rows } = await query(
      `SELECT id, email, phone, password_hash, full_name, role, status,
              city, avatar_url, rating, reviews_count, created_at
       FROM users WHERE ${isEmail ? 'email' : 'phone'} = $1 LIMIT 1`,
      [identifier]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Yanlış məlumatlar' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Hesab bloklanıb' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Yanlış məlumatlar' });

    delete user.password_hash;
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);
    res.json({ token: signToken(user), user });
  } catch (e) {
    next(e);
  }
});

// =====================================================================
// OTP / SMS qeydiyyat (sürətli flow)
// =====================================================================

const phoneSchema = z.object({
  phone: z.string().min(7),
  full_name: z.string().min(2).max(120).optional(),
});

const verifySchema = z.object({
  phone: z.string().min(7),
  code: z.string().regex(/^\d{4,6}$/),
  full_name: z.string().min(2).max(120).optional(),
});

// POST /auth/send-otp — telefon nömrəsinə SMS göndərir
router.post('/send-otp', async (req, res, next) => {
  try {
    const data = phoneSchema.parse(req.body);
    const phone = normalizePhone(data.phone);

    // Rate limit: son 1 dəqiqədə 1 dəfə
    const recent = await query(
      `SELECT id FROM otp_codes WHERE phone = $1 AND created_at > NOW() - INTERVAL '60 seconds'`,
      [phone]
    );
    if (recent.rows.length > 0) {
      return res.status(429).json({ error: 'Çox tez-tez. 60 saniyə gözləyin' });
    }

    // 6 rəqəmli kod yarat
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dəqiqə

    await query(
      `INSERT INTO otp_codes (phone, code, full_name, expires_at) VALUES ($1, $2, $3, $4)`,
      [phone, code, data.full_name || null, expiresAt]
    );

    await sendSms(phone, `360tap.az təsdiq kodu: ${code}. 5 dəqiqə etibarlıdır.`);

    // Dev mode: kodu cavabda da qaytarırıq, prod-da silmək
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      ok: true,
      phone,
      message: 'Kod göndərildi',
      ...(isDev ? { dev_code: code } : {}),
    });
  } catch (e) { next(e); }
});

// POST /auth/verify-otp — kodu yoxlayır, hesab yaradır/girişə icazə verir
router.post('/verify-otp', async (req, res, next) => {
  try {
    const data = verifySchema.parse(req.body);
    const phone = normalizePhone(data.phone);

    // Aktiv OTP tap
    const { rows } = await query(
      `SELECT id, code, full_name, attempts, expires_at, used FROM otp_codes
       WHERE phone = $1 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (!rows[0]) {
      return res.status(400).json({ error: 'Kod tapılmadı və ya vaxtı keçib' });
    }
    const otp = rows[0];

    if (otp.attempts >= 5) {
      return res.status(429).json({ error: 'Çox cəhd. Yeni kod istəyin' });
    }

    if (otp.code !== data.code) {
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
      return res.status(400).json({ error: 'Yanlış kod' });
    }

    // Kodu işlədilmiş kimi qeyd et
    await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otp.id]);

    // İstifadəçi var mı?
    let { rows: userRows } = await query(`SELECT * FROM users WHERE phone = $1 LIMIT 1`, [phone]);
    let user;
    if (userRows[0]) {
      // Login
      user = userRows[0];
      await query(
        `UPDATE users SET is_phone_verified = true, last_login_at = NOW() WHERE id = $1`,
        [user.id]
      );
      user.is_phone_verified = true;
    } else {
      // Avtomatik qeydiyyat
      const fullName = data.full_name || otp.full_name || `İstifadəçi ${phone.slice(-4)}`;
      // Random parol — istifadəçi sonra dəyişə bilər (ayarlardan)
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passHash = await bcrypt.hash(tempPassword, 10);

      const { rows: newUser } = await query(
        `INSERT INTO users (phone, password_hash, full_name, is_phone_verified)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [phone, passHash, fullName]
      );
      user = newUser[0];
    }

    // Token
    delete user.password_hash;
    const token = jwt.sign(
      { sub: user.id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    res.json({ token, user, isNew: !userRows[0] });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Bu telefon artıq qeydiyyatdadır' });
    }
    next(e);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, phone, full_name, role, city, avatar_url, bio,
              rating, reviews_count, is_phone_verified, is_email_verified,
              is_business, created_at
       FROM users WHERE id = $1`,
      [req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const schema = z.object({
      full_name: z.string().min(2).max(120).optional(),
      city: z.string().max(80).optional(),
      bio: z.string().max(500).optional(),
      avatar_url: z.string().url().optional(),
    });
    const data = schema.parse(req.body);
    const fields = Object.keys(data);
    if (!fields.length) return res.json({ ok: true });
    const setSql = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map((k) => data[k]);
    const { rows } = await query(
      `UPDATE users SET ${setSql} WHERE id = $1
       RETURNING id, email, phone, full_name, role, city, avatar_url, bio, rating, reviews_count`,
      [req.user.sub, ...values]
    );
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
});

export default router;
