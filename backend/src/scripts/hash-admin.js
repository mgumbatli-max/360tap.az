import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

const password = process.argv[2] || 'admin123';
const hash = await bcrypt.hash(password, 10);

await pool.query(
  `UPDATE users SET password_hash = $1 WHERE email = 'admin@360tap.az'`,
  [hash]
);

console.log('Admin parolu yeniləndi:', password);
console.log('Hash:', hash);
await pool.end();
