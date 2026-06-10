'use client';
import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';

export default function InsuranceCalc() {
  const [carPrice, setCarPrice] = useState(30000);
  const [year, setYear] = useState(2020);
  const [drivers, setDrivers] = useState(1);
  const [age, setAge] = useState(35);
  const [result, setResult] = useState<any>(null);

  const calc = () => {
    const ageFactor = age < 25 ? 1.5 : age > 60 ? 1.2 : 1.0;
    const yearFactor = (2026 - year) > 10 ? 0.7 : 1.0;
    const driverFactor = 1 + (drivers - 1) * 0.15;
    const osago = Math.round(50 * ageFactor * driverFactor);
    const kasko = Math.round(carPrice * 0.045 * ageFactor * yearFactor);
    setResult({ osago, kasko, total: osago + kasko });
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-tap" /> Sığorta kalkulyatoru</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <NumIn label="Avtomobil qiyməti (₼)" value={carPrice} setValue={setCarPrice} />
        <NumIn label="İl" value={year} setValue={setYear} />
        <NumIn label="Sürücü sayı" value={drivers} setValue={setDrivers} />
        <NumIn label="Yaş" value={age} setValue={setAge} />
      </div>
      <button onClick={calc} className="btn-tap w-full">Hesabla</button>
      {result && (
        <div className="mt-4 space-y-2 animate-fade-in-up">
          <Row label="ICAS (məcburi)" value={result.osago} />
          <Row label="KASKO (könüllü)" value={result.kasko} />
          <Row label="Cəmi (illik)" value={result.total} bold />
        </div>
      )}
    </div>
  );
}

function NumIn({ label, value, setValue }: any) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-ink-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="input" />
    </div>
  );
}
function Row({ label, value, bold }: any) {
  return (
    <div className={`flex justify-between py-1 ${bold ? 'border-t pt-2 mt-2 border-ink-200' : ''}`}>
      <span className={bold ? 'font-bold' : 'text-sm text-ink-700'}>{label}</span>
      <span className={`font-bold ${bold ? 'text-tap text-lg' : ''}`}>{value.toLocaleString('az-AZ')} ₼</span>
    </div>
  );
}
