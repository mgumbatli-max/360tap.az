'use client';
import { useState, useMemo } from 'react';
import { Wallet, Fuel, Wrench, FileText, Shield } from 'lucide-react';

export default function MonthlyCostCalc() {
  const [fuelKm, setFuelKm] = useState(7);
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [fuelPrice, setFuelPrice] = useState(1.4);
  const [insurance, setInsurance] = useState(800);
  const [tax, setTax] = useState(200);
  const [service, setService] = useState(120);

  const fuel = useMemo(() => Math.round((fuelKm / 100) * monthlyKm * fuelPrice), [fuelKm, monthlyKm, fuelPrice]);
  const insMonthly = Math.round(insurance / 12);
  const taxMonthly = Math.round(tax / 12);
  const total = fuel + insMonthly + taxMonthly + service;

  return (
    <div className="card p-5">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-tap" /> Aylıq xərclər kalkulyatoru</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <NumIn label="Yanacaq sərfi (l/100km)" value={fuelKm} setValue={setFuelKm} step={0.1} />
        <NumIn label="Aylıq sürmə (km)" value={monthlyKm} setValue={setMonthlyKm} />
        <NumIn label="Yanacaq qiyməti (₼)" value={fuelPrice} setValue={setFuelPrice} step={0.05} />
        <NumIn label="Sığorta (illik)" value={insurance} setValue={setInsurance} />
        <NumIn label="Avtoyol vergisi" value={tax} setValue={setTax} />
        <NumIn label="Servis (aylıq)" value={service} setValue={setService} />
      </div>

      <div className="space-y-1.5">
        <CostRow icon={Fuel} label="Yanacaq" value={fuel} color="text-orange-500" />
        <CostRow icon={Shield} label="Sığorta" value={insMonthly} color="text-blue-500" />
        <CostRow icon={FileText} label="Vergi" value={taxMonthly} color="text-violet-500" />
        <CostRow icon={Wrench} label="Servis" value={service} color="text-emerald-500" />
        <div className="flex justify-between pt-2 mt-2 border-t border-ink-200 font-extrabold text-lg">
          <span>Cəmi aylıq</span>
          <span className="text-tap">{total.toLocaleString('az-AZ')} ₼</span>
        </div>
      </div>
    </div>
  );
}

function NumIn({ label, value, setValue, step = 1 }: any) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-ink-500 mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => setValue(Number(e.target.value))} className="input" />
    </div>
  );
}
function CostRow({ icon: I, label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm"><I className={`w-3.5 h-3.5 ${color}`} />{label}</span>
      <strong>{value.toLocaleString('az-AZ')} ₼</strong>
    </div>
  );
}
