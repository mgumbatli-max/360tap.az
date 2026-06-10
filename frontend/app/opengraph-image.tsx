import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '360tap.az — Azərbaycanda elanlar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        color: 'white', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>360tap.az</div>
        <div style={{ fontSize: 38, marginTop: 16, opacity: 0.95 }}>
          Azərbaycanda elanlar və alqı-satqı
        </div>
        <div style={{ fontSize: 26, marginTop: 40, opacity: 0.85 }}>
          🚗 Avtomobil · 🏠 Mənzil · 📱 Telefon · 💼 İş
        </div>
      </div>
    ),
    size,
  );
}
