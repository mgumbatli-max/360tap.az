'use client';
import { useState } from 'react';
import { Sparkles, TrendingUp, Eye, Clock, Loader2 } from 'lucide-react';

export default function ListingForecast() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const run = () => {
    setLoading(true);
    setTimeout(() => {
      setData({
        views_7d: 120 + Math.floor(Math.random() * 200),
        favorites_7d: 8 + Math.floor(Math.random() * 25),
        sell_days: 7 + Math.floor(Math.random() * 21),
        score: 75 + Math.floor(Math.random() * 25),
      });
      setLoading(false);
    }, 1000);
  };
  return (
    <div className="card p-4 bg-gradient-to-br from-tap-50 to-violet-50">
      <h3 className="font-bold flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-tap" /> AI proqnoz</h3>
      <p className="text-xs text-ink-600 mb-3">Bu elanın 7 gündə nəticələrini gör</p>
      {!data ? (
        <button onClick={run} disabled={loading} className="btn-tap w-full text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} Proqnoz hesabla
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Cell icon={Eye} value={data.views_7d} label="baxış (7g)" />
          <Cell icon={TrendingUp} value={data.favorites_7d} label="sevimli" />
          <Cell icon={Clock} value={`${data.sell_days} gün`} label="satış vaxtı" />
          <Cell icon={Sparkles} value={`${data.score}/100`} label="cazibə balı" />
        </div>
      )}
    </div>
  );
}
function Cell({ icon: I, value, label }: any) {
  return (
    <div className="bg-white dark:bg-ink-800 p-2 rounded-lg text-center">
      <I className="w-3.5 h-3.5 mx-auto text-tap" />
      <div className="font-extrabold text-lg">{value}</div>
      <div className="text-[10px] text-ink-500">{label}</div>
    </div>
  );
}
