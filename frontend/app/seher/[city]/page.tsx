import { redirect } from 'next/navigation';

// SEO landing → işlək region axtarışına yönləndir (dərin landing sonra)
export default async function CityLandingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  redirect(`/elanlar?region=${encodeURIComponent(city)}`);
}
