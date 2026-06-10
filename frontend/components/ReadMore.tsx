'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ReadMore({
  children,
  text,
  maxChars = 280,
}: {
  children?: React.ReactNode;
  text?: string;
  maxChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = text || (typeof children === 'string' ? children : '');

  if (content.length <= maxChars) return <>{children || content}</>;

  const truncated = content.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap leading-relaxed">
        {expanded ? content : truncated}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-tap text-sm font-semibold hover:underline inline-flex items-center gap-1"
      >
        {expanded ? <>Az göstər <ChevronUp className="w-4 h-4" /></>
                  : <>Daha çox göstər <ChevronDown className="w-4 h-4" /></>}
      </button>
    </div>
  );
}
