'use client';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { azNumber } from '@/lib/format';

export default function CarCreditCalc({ price = 30000 }: { price?: number }) {
  const [carPrice, setCarPrice] = useState(price);
  const [down, setDown] = useState(Math.round(price * 0.2));
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(14);

  const principal = carPrice - down;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const monthly = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : principal / n;
  const total = monthly * n + down;
  const overpay = total - carPrice;

  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-tap" /> Kredit kalkulyatoru</h3>

      <div className="space-y-3">
        <Range label="Avtomobil qiyməti" value={carPrice} setValue={setCarPrice} min={3000} max={300000} step={500} suffix=" ₼" />
        <Range label="İlkin ödəniş" value={down} setValue={setDown} min={0} max={carPrice} step={500} suffix=" ₼" />
        <Range label="Müddət" value={years} setValue={setYears} min={1} max={7} step={1} suffix=" il" />
        <Range label="Faiz" value={rate} setValue={setRate} min={6} max={28} step={0.5} suffix=" %" />
      </div>

      <div className="mt-5 p-4 bg-tap-50 dark:bg-tap/10 rounded-xl">
        <div className="text-xs text-ink-600">Aylıq ödəniş</div>
        <div className="text-3xl font-extrabold text-tap">{azNumber(Math.round(monthly))} ₼</div>
        <div className="text-xs space-y-0.5 mt-2 text-ink-600">
          <div>Ümumi ödəniş: <strong>{azNumber(Math.round(total))}₼</strong></div>
          <div>Əlavə ödəniş: <strong className="text-amber-600">{azNumber(Math.round(overpay))}₼</strong></div>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, setValue, min, max, step, suffix }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1"><span>{label}</span><span className="text-tap">{azNumber(value)}{suffix}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full" />
    </div>
  );
}
