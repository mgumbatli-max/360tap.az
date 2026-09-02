'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

export default function SavedMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    api<{ matches: any[] }>(`/realestate/match-saved-searches`)
      .then((d) => setMatches(d.matches || []))
      .catch(() => setMatches([]));
  }, []);

  if (!matches.length) return null;

  return (
    <div className="card p-3 bg-gradient-to-r from-tap-50 to-blue-50 border-tap/30 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4 text-tap animate-pulse" />
        <span className="font-bold text-sm">Yeni uyğun elanlar var!</span>
      </div>
      <div className="space-y-1 text-xs">
        {matches.slice(0, 3).map((m) => (
          <div key={m.id} className="flex justify-between">
            <span className="text-ink-700">&quot;{m.name}&quot;</span>
            <span className="font-bold text-tap">+{m.new_matches} yeni</span>
          </div>
        ))}
      </div>
    </div>
  );
}
