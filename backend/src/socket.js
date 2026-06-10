import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

export function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token tələb olunur'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Yanlış token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`[ws] user ${socket.userId} qoşuldu`);

    // Yazır indikatoru
    socket.on('chat:typing', async ({ chatId, typing }) => {
      try {
        const { rows } = await query(
          `SELECT buyer_id, seller_id FROM chats WHERE id = $1`,
          [chatId]
        );
        if (!rows[0]) return;
        const other = rows[0].buyer_id === socket.userId ? rows[0].seller_id : rows[0].buyer_id;
        if (rows[0].buyer_id !== socket.userId && rows[0].seller_id !== socket.userId) return;
        io.to(`user:${other}`).emit('chat:typing', { chatId, userId: socket.userId, typing });
      } catch {}
    });

    // Mesaj göndər (real-time)
    socket.on('chat:send', async ({ chatId, content, attachment_url }, ack) => {
      try {
        if (!content || content.length > 4000) {
          ack?.({ ok: false, error: 'Mesaj boş və ya çox uzundur' });
          return;
        }
        const { rows: cr } = await query(
          `SELECT buyer_id, seller_id FROM chats WHERE id = $1`,
          [chatId]
        );
        if (!cr[0]) { ack?.({ ok: false, error: 'Chat tapılmadı' }); return; }
        if (cr[0].buyer_id !== socket.userId && cr[0].seller_id !== socket.userId) {
          ack?.({ ok: false, error: 'İcazə yox' });
          return;
        }

        const { rows } = await query(
          `INSERT INTO messages (chat_id, sender_id, content, attachment_url)
           VALUES ($1, $2, $3, $4)
           RETURNING id, chat_id, sender_id, content, attachment_url, read_at, created_at`,
          [chatId, socket.userId, content, attachment_url ?? null]
        );
        await query(`UPDATE chats SET last_message_at = NOW() WHERE id = $1`, [chatId]);

        const message = rows[0];
        const otherId = cr[0].buyer_id === socket.userId ? cr[0].seller_id : cr[0].buyer_id;

        // Hər iki tərəfə (öz cihazları + qarşı tərəf)
        io.to(`user:${socket.userId}`).emit('chat:message', { message, chatId });
        io.to(`user:${otherId}`).emit('chat:message', { message, chatId });

        ack?.({ ok: true, message });
      } catch (e) {
        console.error('[ws] chat:send error', e);
        ack?.({ ok: false, error: 'Server xətası' });
      }
    });

    // Read receipt
    socket.on('chat:read', async ({ chatId }) => {
      try {
        const { rows } = await query(
          `SELECT buyer_id, seller_id FROM chats WHERE id = $1`,
          [chatId]
        );
        if (!rows[0]) return;
        const isBuyer = rows[0].buyer_id === socket.userId;
        if (!isBuyer && rows[0].seller_id !== socket.userId) return;

        await query(
          `UPDATE chats SET ${isBuyer ? 'buyer_last_read_at' : 'seller_last_read_at'} = NOW() WHERE id = $1`,
          [chatId]
        );
        await query(
          `UPDATE messages SET read_at = NOW() WHERE chat_id = $1 AND sender_id != $2 AND read_at IS NULL`,
          [chatId, socket.userId]
        );

        const otherId = isBuyer ? rows[0].seller_id : rows[0].buyer_id;
        io.to(`user:${otherId}`).emit('chat:read', { chatId, by: socket.userId });
      } catch {}
    });

    socket.on('disconnect', () => {
      console.log(`[ws] user ${socket.userId} ayrıldı`);
    });
  });

  global.io = io;
  return io;
}
