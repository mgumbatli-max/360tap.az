'use client';
import { useState, useMemo, useEffect } from 'react';
import { Search, Beaker, Sparkles, Filter, Check, Zap, Crown, Award, X } from 'lucide-react';
import { LAB_FEATURES, LAB_CATEGORIES, type LabFeature } from '@/lib/lab-features';
import { useToast } from '@/lib/toast';

const KEY = 'tap_lab_enabled';

export default function LabClient() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      setEnabled(new Set(saved));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    const next = new Set(enabled);
    if (next.has(id)) {
      next.delete(id);
      toast.warning('Funksiya söndürüldü');
    } else {
      next.add(id);
      toast.success('✨ Funksiya aktivləşdirildi');
    }
    setEnabled(next);
    localStorage.setItem(KEY, JSON.stringify([...next]));
  };

  const filtered = useMemo(() => {
    return LAB_FEATURES.filter((f) => {
      if (cat !== 'all' && f.category !== cat) return false;
      if (showOnlyEnabled && !enabled.has(f.id)) return false;
      if (q && !`${f.name} ${f.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, cat, showOnlyEnabled, enabled]);

  const exclusive = LAB_FEATURES.filter((f) => f.exclusive);
  const stats = {
    total: LAB_FEATURES.length,
    enabled: enabled.size,
    ai: LAB_FEATURES.filter((f) => f.ai).length,
    exclusive: exclusive.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="card p-6 sm:p-8 mb-6 bg-gradient-to-br from-violet-500 via-tap to-cyan-400 text-white overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-8 h-8" />
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-bold">BETA</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2">360 Lab</h1>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl">
            Claude AI tərəfindən təklif edilən <strong>{stats.total} eksperimental funksiya</strong>.
            Hər birini toggle ilə aktivləşdirin, sınayın, lazımsızsa söndürün.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Stat icon={Sparkles} label="Cəmi funksiya" value={stats.total} />
            <Stat icon={Zap} label="Aktivləşdirilmiş" value={stats.enabled} highlight />
            <Stat icon={Sparkles} label="AI ilə işləyən" value={stats.ai} />
            <Stat icon={Crown} label="Eksklüziv" value={stats.exclusive} />
          </div>
        </div>
      </div>

      {/* 10 Eksklüziv Banner */}
      <section className="mb-6">
        <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" /> 10 Eksklüziv funksiya
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Yalnız 360tap-da</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {exclusive.map((f) => {
            const on = enabled.has(f.id);
            return (
              <button key={f.id} onClick={() => toggle(f.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                  on ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg' : 'border-ink-200 hover:border-amber-300'
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{f.emoji}</div>
                  {on && <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>}
                </div>
                <h3 className="font-bold text-sm mb-1">{f.name}</h3>
                <p className="text-xs text-ink-600 line-clamp-3">{f.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="card p-4 mb-5 sticky top-16 z-30 bg-white/95 backdrop-blur dark:bg-[#1c2128]/95">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Funksiya axtar (məs: AI, photo, voice, mortgage)..."
              className="input pl-9" />
            {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-ink-400" /></button>}
          </div>
          <button onClick={() => setShowOnlyEnabled(!showOnlyEnabled)}
            className={`btn-secondary !px-3 ${showOnlyEnabled ? '!border-tap text-tap' : ''}`}>
            <Filter className="w-4 h-4" /> {showOnlyEnabled ? 'Hamısı' : 'Aktivlər'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Cat label="Hamısı" emoji="✨" active={cat === 'all'} onClick={() => setCat('all')} count={LAB_FEATURES.length} />
          {LAB_CATEGORIES.map((c) => {
            const cnt = LAB_FEATURES.filter((f) => f.category === c.id).length;
            return <Cat key={c.id} label={c.id} emoji={c.emoji} active={cat === c.id} onClick={() => setCat(c.id)} count={cnt} />;
          })}
        </div>
      </div>

      {/* Functions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((f) => <FeatureCard key={f.id} feature={f} enabled={enabled.has(f.id)} onToggle={() => toggle(f.id)} />)}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Beaker className="w-16 h-16 mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500">Bu filterlərlə funksiya tapılmadı</p>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature, enabled, onToggle }: { feature: LabFeature; enabled: boolean; onToggle: () => void }) {
  const c = LAB_CATEGORIES.find((x) => x.id === feature.category);
  return (
    <button onClick={onToggle}
      className={`text-left p-4 card transition-all hover:shadow-lg ${enabled ? '!border-tap shadow-md bg-tap-50/30 dark:bg-tap/10' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-2xl">{feature.emoji}</div>
          {feature.exclusive && <Crown className="w-3.5 h-3.5 text-amber-500" />}
          {feature.ai && !feature.exclusive && <Sparkles className="w-3.5 h-3.5 text-violet-500" />}
        </div>
        <div className={`relative w-9 h-5 rounded-full transition ${enabled ? 'bg-tap' : 'bg-ink-200 dark:bg-ink-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
        </div>
      </div>
      <h3 className="font-bold text-sm mb-1 leading-tight">{feature.name}</h3>
      <p className="text-xs text-ink-600 dark:text-ink-400 line-clamp-3 mb-2">{feature.description}</p>
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${c?.accent || 'bg-ink-100 text-ink-600'}`}>{feature.category}</span>
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
          feature.complexity === 'easy' ? 'bg-emerald-50 text-emerald-700' :
          feature.complexity === 'medium' ? 'bg-amber-50 text-amber-700' :
          'bg-red-50 text-red-700'
        }`}>{feature.complexity}</span>
      </div>
    </button>
  );
}

function Stat({ icon: I, label, value, highlight }: any) {
  return (
    <div className={`px-3 py-2 rounded-xl ${highlight ? 'bg-white/30 backdrop-blur' : 'bg-white/15 backdrop-blur'} flex items-center gap-2`}>
      <I className="w-4 h-4" />
      <div>
        <div className="text-[10px] opacity-80">{label}</div>
        <div className="font-extrabold">{value}</div>
      </div>
    </div>
  );
}

function Cat({ label, emoji, active, onClick, count }: any) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
        active ? 'bg-tap text-white border-tap' : 'border-ink-200 hover:border-tap text-ink-700'
      }`}>
      {emoji} {label} <span className="opacity-60 ml-0.5">{count}</span>
    </button>
  );
}
