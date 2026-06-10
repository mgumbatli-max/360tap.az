import { Router } from 'express';
import { z } from 'zod';
import { query, pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /chats — istifadəçinin bütün chatları
router.get('/', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         c.id, c.listing_id, c.created_at, c.last_message_at,
         CASE WHEN c.buyer_id = $1 THEN c.buyer_last_read_at ELSE c.seller_last_read_at END AS my_last_read,
         CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END AS other_id,
         u.full_name AS other_name, u.avatar_url AS other_avatar,
         l.title AS listing_title, l.price AS listing_price, l.currency,
         (SELECT url FROM listing_media WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS listing_cover,
         (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT sender_id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender,
         (SELECT COUNT(*)::int FROM messages
          WHERE chat_id = c.id AND sender_id != $1
            AND (read_at IS NULL OR read_at > NOW())
            AND created_at > COALESCE(
              CASE WHEN c.buyer_id = $1 THEN c.buyer_last_read_at ELSE c.seller_last_read_at END,
              '1970-01-01'::timestamptz
            )) AS unread_count
       FROM chats c
       JOIN users u ON u.id = (CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END)
       JOIN listings l ON l.id = c.listing_id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

// GET /chats/:id — chat detalı + son mesajlar
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const { rows: cr } = await query(
      `SELECT c.*, u_buyer.full_name AS buyer_name, u_buyer.avatar_url AS buyer_avatar,
              u_seller.full_name AS seller_name, u_seller.avatar_url AS seller_avatar,
              l.title AS listing_title, l.price AS listing_price, l.currency,
              (SELECT url FROM listing_media WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS listing_cover
       FROM chats c
       JOIN users u_buyer ON u_buyer.id = c.buyer_id
       JOIN users u_seller ON u_seller.id = c.seller_id
       JOIN listings l ON l.id = c.listing_id
       WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
      [req.params.id, req.user.sub]
    );
    if (!cr[0]) return res.status(404).json({ error: 'Chat tapılmadı' });

    const chat = cr[0];

    // Mark as read
    const isBuyer = chat.buyer_id === req.user.sub;
    await query(
      `UPDATE chats SET ${isBuyer ? 'buyer_last_read_at' : 'seller_last_read_at'} = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await query(
      `UPDATE messages SET read_at = NOW()
       WHERE chat_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [req.params.id, req.user.sub]
    );

    const { rows: msgs } = await query(
      `SELECT id, chat_id, sender_id, content, attachment_url, read_at, created_at
       FROM messages WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 200`,
      [req.params.id]
    );

    res.json({
      chat: {
        id: chat.id,
        listing: {
          id: chat.listing_id,
          title: chat.listing_title,
          price: chat.listing_price,
          currency: chat.currency,
          cover: chat.listing_cover,
        },
        buyer: { id: chat.buyer_id, name: chat.buyer_name, avatar: chat.buyer_avatar },
        seller: { id: chat.seller_id, name: chat.seller_name, avatar: chat.seller_avatar },
        other: isBuyer
          ? { id: chat.seller_id, name: chat.seller_name, avatar: chat.seller_avatar }
          : { id: chat.buyer_id, name: chat.buyer_name, avatar: chat.buyer_avatar },
      },
      messages: msgs,
    });
  } catch (e) { next(e); }
});

// POST /chats — yeni chat yaratmaq və ya mövcud olanı tapmaq
const startSchema = z.object({
  listing_id: z.string().uuid(),
  message: z.string().min(1).max(4000).optional(),
});

router.post('/', authRequired, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const data = startSchema.parse(req.body);
    const { rows: lr } = await client.query(`SELECT owner_id FROM listings WHERE id = $1`, [data.listing_id]);
    if (!lr[0]) return res.status(404).json({ error: 'Elan tapılmadı' });
    if (lr[0].owner_id === req.user.sub) {
      return res.status(400).json({ error: 'Öz elanınıza yaza bilməzsiniz' });
    }

    await client.query('BEGIN');

    // Mövcud chat?
    const { rows: ex } = await client.query(
      `SELECT id FROM chats WHERE listing_id = $1 AND buyer_id = $2 AND seller_id = $3`,
      [data.listing_id, req.user.sub, lr[0].owner_id]
    );
    let chatId;
    if (ex[0]) {
      chatId = ex[0].id;
    } else {
      const { rows: nc } = await client.query(
        `INSERT INTO chats (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id`,
        [data.listing_id, req.user.sub, lr[0].owner_id]
      );
      chatId = nc[0].id;
    }

    // İlk mesaj (varsa)
    if (data.message) {
      await client.query(
        `INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3)`,
        [chatId, req.user.sub, data.message]
      );
      await client.query(`UPDATE chats SET last_message_at = NOW() WHERE id = $1`, [chatId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ chat_id: chatId });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
});

// POST /chats/:id/messages — mesaj göndər (REST fallback, real-time WS-də olur)
const msgSchema = z.object({
  content: z.string().min(1).max(4000),
  attachment_url: z.string().url().optional(),
});

router.post('/:id/messages', authRequired, async (req, res, next) => {
  try {
    const data = msgSchema.parse(req.body);
    const { rows: cr } = await query(
      `SELECT id, buyer_id, seller_id FROM chats WHERE id = $1`,
      [req.params.id]
    );
    if (!cr[0]) return res.status(404).json({ error: 'Chat tapılmadı' });
    if (cr[0].buyer_id !== req.user.sub && cr[0].seller_id !== req.user.sub) {
      return res.status(403).json({ error: 'İcazəniz yoxdur' });
    }

    const { rows } = await query(
      `INSERT INTO messages (chat_id, sender_id, content, attachment_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, chat_id, sender_id, content, attachment_url, read_at, created_at`,
      [req.params.id, req.user.sub, data.content, data.attachment_url ?? null]
    );
    await query(`UPDATE chats SET last_message_at = NOW() WHERE id = $1`, [req.params.id]);

    // WebSocket broadcast (io qlobal)
    const message = rows[0];
    const recipientId = cr[0].buyer_id === req.user.sub ? cr[0].seller_id : cr[0].buyer_id;
    if (global.io) {
      global.io.to(`user:${recipientId}`).emit('chat:message', { message, chatId: req.params.id });
      global.io.to(`user:${req.user.sub}`).emit('chat:message:sent', { message, chatId: req.params.id });
    }

    res.status(201).json({ message });
  } catch (e) { next(e); }
});

// GET /chats/unread-count — header üçün
router.get('/meta/unread-count', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS unread FROM messages m
       JOIN chats c ON c.id = m.chat_id
       WHERE m.sender_id != $1
         AND (c.buyer_id = $1 OR c.seller_id = $1)
         AND (m.read_at IS NULL)`,
      [req.user.sub]
    );
    res.json({ unread: rows[0].unread });
  } catch (e) { next(e); }
});

export default router;
