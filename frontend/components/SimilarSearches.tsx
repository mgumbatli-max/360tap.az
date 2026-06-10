'use client';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function SimilarSearches({ category, title }: { category?: string; title: string }) {
  const queries = [
    `${title.split(' ')[0]} ucuz`,
    `${title.split(' ')[0]} Bakıda`,
    `${title.split(' ')[0]} işlənmiş`,
    `${title.split(' ')[0]} kreditlə`,
  ].filter((q, i, arr) => arr.indexOf(q) === i);

  return (
    <div className="card p-4">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-tap" /> Bənzər axtarışlar
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {queries.map((q) => (
          <Link key={q} href={`/elanlar?q=${encodeURIComponent(q)}`}
            className="px-3 py-1.5 rounded-full bg-ink-100 dark:bg-ink-800 text-sm hover:bg-tap-50 hover:text-tap transition">
            {q}
          </Link>
        ))}
      </div>
    </div>
  );
}
