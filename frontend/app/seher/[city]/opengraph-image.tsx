import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const alt = 'Şəhər — 360tap.az';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
type Props = { params: Promise<{ city: string }> };
export default async function OG({ params }: Props) {
  const p = await params;
  const city = p['city'].replace(/-/g, ' ');
  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
        color: 'white', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 28, opacity: 0.8 }}>360tap.az</div>
        {/*
          `display: 'flex'` MƏCBURİDİR. Satori (next/og) birdən çox uşaq düyünü olan
          div üçün açıq `display` tələb edir; burada uşaqlar ikidir («📍 » mətni +
          {city}), ona görə render istisna atırdı və marşrut lokalda cavabsız
          bağlanır, canlıda isə 0 baytlıq image/png 200 qaytarırdı.
          Alternativ (emoji ilə şəhəri bir string-ə birləşdirmək) rədd edildi —
          bu fayldakı digər div-lər onsuz da açıq `display` istifadə edir, ona görə
          eyni üslubu saxlamaq daha az sürprizlidir.
          QEYD: `textTransform: 'capitalize'` GÜNAHKAR DEYİL — ölçüldü, işləyir.
        */}
        <div style={{ display: 'flex', fontSize: 80, fontWeight: 900, textTransform: 'capitalize', marginTop: 8 }}>📍 {city}</div>
        <div style={{ fontSize: 28, marginTop: 32, opacity: 0.9 }}>Bu şəhərdə bütün elanlar</div>
      </div>
    ),
    size,
  );
}
