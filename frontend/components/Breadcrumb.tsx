import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';

export type Crumb = { name: string; url?: string };

export default function Breadcrumb({ items, withHome = true }: { items: Crumb[]; withHome?: boolean }) {
  const all: Crumb[] = withHome ? [{ name: 'Ana', url: '/' }, ...items] : items;
  const ld = jsonLdBreadcrumb(all);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-500 overflow-x-auto scrollbar-thin">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <span key={i} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-ink-300 shrink-0" />}
              {c.url && !last ? (
                <Link href={c.url} className="hover:text-tap flex items-center gap-1">
                  {i === 0 && withHome && <Home className="w-3.5 h-3.5" />}
                  {c.name}
                </Link>
              ) : (
                <span className={`${last ? 'text-ink-900 font-medium' : ''} flex items-center gap-1`}>
                  {i === 0 && withHome && <Home className="w-3.5 h-3.5" />}
                  {c.name}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
