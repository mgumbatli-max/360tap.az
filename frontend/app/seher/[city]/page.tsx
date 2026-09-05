import { redirect } from 'next/navigation';
import { buildRedirectUrl, type IncomingParams } from '@/lib/forward-params';

// SEO landing → işlək region axtarışına yönləndir (dərin landing sonra)
export default async function CityLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<IncomingParams>;
}) {
  const { city } = await params;
  redirect(buildRedirectUrl({ region: city }, await searchParams));
}
