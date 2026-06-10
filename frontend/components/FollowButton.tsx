'use client';
import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useToast } from '@/lib/toast';

const KEY = 'tap_followed_users';

function getFollowed(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function setFollowed(list: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function FollowButton({ userId, name }: { userId: string; name: string }) {
  const toast = useToast();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(getFollowed().includes(userId));
  }, [userId]);

  const onClick = () => {
    const list = getFollowed();
    if (following) {
      setFollowed(list.filter((id) => id !== userId));
      setFollowing(false);
      toast.info(`${name} izləmədən çıxarıldı`);
    } else {
      setFollowed([...list, userId]);
      setFollowing(true);
      toast.success(`${name} izlənilir — yeni elanlardan xəbər tutacaqsınız`);
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
        following
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
          : 'bg-tap text-white border-tap hover:bg-tap-dark'
      }`}
    >
      {following ? <><UserCheck className="w-4 h-4" /> İzlənilir</>
                 : <><UserPlus className="w-4 h-4" /> İzlə</>}
    </button>
  );
}
