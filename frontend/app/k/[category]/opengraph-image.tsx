import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kateqoriya — 360tap.az';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ category: string }> };

const NAMES: Record<string, string> = {
  'avtomobil': 'Avtomobil',
  'menzil-satilir': 'Mənzil satılır',
  'menzil-kiraye': 'Kirayə mənzil',
  'telefon': 'Telefon',
  'noutbuk': 'Noutbuk',
  'kompyuter': 'Kompüter',
  'is': 'İş elanları',
};

export default async function OG({ params }: Props) {
  const { category } = await params;
  const name = NAMES[category] || category.replace(/-/g, ' ');

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        color: 'white', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 28, opacity: 0.8, marginBottom: 8 }}>360tap.az kateqoriyası</div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>{name}</div>
        <div style={{ fontSize: 28, marginTop: 32, opacity: 0.9 }}>
          Minlərlə elan • Hər kateqoriya • Pulsuz
        </div>
      </div>
    ),
    size,
  );
}
