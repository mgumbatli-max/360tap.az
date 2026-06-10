'use client';
import { useState, useEffect } from 'react';
import { FolderPlus, Folder, Trash2, Edit2 } from 'lucide-react';

const KEY = 'tap_wishlist_groups';
type Group = { id: string; name: string; emoji: string; items: string[] };

export default function WishlistGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    try { setGroups(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
  }, []);
  const save = (g: Group[]) => { setGroups(g); localStorage.setItem(KEY, JSON.stringify(g)); };

  const create = () => {
    if (!newName.trim()) return;
    const emojis = ['🚗','🏠','📱','💼','🎮','👕','💎','🏖','⚽','📚'];
    save([...groups, { id: String(Date.now()), name: newName, emoji: emojis[groups.length % emojis.length], items: [] }]);
    setNewName('');
  };
  const remove = (id: string) => save(groups.filter((g) => g.id !== id));

  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><FolderPlus className="w-4 h-4 text-tap" /> Sevimlilər qrupları</h3>
      <div className="flex gap-2 mb-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni qrup adı"
          onKeyDown={(e) => e.key === 'Enter' && create()} className="input flex-1 !py-2 !text-sm" />
        <button onClick={create} className="btn-tap !py-2 !text-sm">+ Yarat</button>
      </div>
      {groups.length === 0 ? (
        <p className="text-xs text-ink-500 text-center py-4">Qrup yoxdur. "BMW-lərim", "Bakıda mənzillər" kimi qruplar yaradın</p>
      ) : (
        <div className="space-y-1.5">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 p-2 bg-ink-50 dark:bg-ink-800/50 rounded-lg group">
              <span className="text-xl">{g.emoji}</span>
              <span className="flex-1 font-semibold text-sm">{g.name}</span>
              <span className="text-xs text-ink-500">{g.items.length} elan</span>
              <button onClick={() => remove(g.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
