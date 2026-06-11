import { redirect } from 'next/navigation';

export default async function CityCategoryLanding({
  params,
}: {
  params: Promise<{ city: string; category: string }>;
}) {
  const { city, category } = await params;
  redirect(`/elanlar?region=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`);
}
