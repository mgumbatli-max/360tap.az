import { redirect } from 'next/navigation';

export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirect(`/elanlar?category=${encodeURIComponent(category)}`);
}
