import { redirect } from 'next/navigation';
import { buildRedirectUrl, type IncomingParams } from '@/lib/forward-params';

export default async function CityCategoryLanding({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; category: string }>;
  searchParams: Promise<IncomingParams>;
}) {
  const { city, category } = await params;
  redirect(buildRedirectUrl({ region: city, category }, await searchParams));
}
