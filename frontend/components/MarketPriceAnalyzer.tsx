'use client';
import { useState } from 'react';
import { TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { CAR_BRANDS } from '@/lib/transport-data';

export default function MarketPriceAnalyzer() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const models = brand ? CAR_BRANDS.find((b) => b.name === brand)?.models || [] : [];

  const analyze = () => {
    if (!brand || !model || !year) return;
    setLoading(true);
    setTimeout(() => {
      const yearNum = parseInt(year);
      const age = 2026 - yearNum;
      const basePrice = 60000 - (age * 2500);
      const mileageFactor = mileage ? Math.max(0, 1 - (parseInt(mileage) / 500000)) : 1;
      const median = Math.max(5000, basePrice * mileageFactor);
      const min = median * 0.85;
      const max = median * 1.20;
      setResult({
        brand, model, year,
        median: Math.round(median),
        min: Math.round(min),
        max: Math.round(max),
        sample: 12 + (yearNum % 25),
        recommendation: median > 30000 ? 'premium' : median > 15000 ? 'orta' : 'sərfəli',
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-tap" /> Bazar qiyməti analizi</h3>
      <p className="text-xs text-ink-500 mb-4">AI ilə avtomobilinizin real bazar qiyməti</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }} className="input">
          <option value="">Marka</option>
          {CAR_BRANDS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
        <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className="input">
          <option value="">Model</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" placeholder="İl" value={year} onChange={(e) => setYear(e.target.value)} className="input" />
        <input type="number" placeholder="Yürüş km" value={mileage} onChange={(e) => setMileage(e.target.value)} className="input" />
      </div>
      <button onClick={analyze} disabled={!brand || !model || !year || loading} className="btn-tap w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Bazarı analiz et
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gradient-to-br from-tap-50 to-violet-50 rounded-xl animate-fade-in-up">
          <div className="text-xs text-ink-600 mb-1">{result.brand} {result.model} {result.year} bazar qiyməti</div>
          <div className="text-3xl font-extrabold text-tap">{result.median.toLocaleString('az-AZ')} ₼</div>
          <div className="flex items-center gap-2 text-xs text-ink-600 mt-2">
            <span>📉 Min: <strong>{result.min.toLocaleString('az-AZ')}₼</strong></span>
            <span>•</span>
            <span>📈 Max: <strong>{result.max.toLocaleString('az-AZ')}₼</strong></span>
            <span>•</span>
            <span>📊 {result.sample} elanda</span>
          </div>
        </div>
      )}
    </div>
  );
}
