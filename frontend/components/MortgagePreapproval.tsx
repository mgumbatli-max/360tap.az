'use client';
import { useState } from 'react';
import { CheckCircle2, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

export default function MortgagePreapproval() {
  const [open, setOpen] = useState(false);
  const [income, setIncome] = useState(2000);
  const [expenses, setExpenses] = useState(1000);
  const [hasLoans, setHasLoans] = useState(false);
  const [result, setResult] = useState<any>(null);

  const check = async () => {
    try {
      const r = await api('/realestate/mortgage-preapprove', {
        method: 'POST',
        body: JSON.stringify({ monthly_income: income, monthly_expenses: expenses, has_other_loans: hasLoans }),
      });
      setResult(r);
    } catch {}
  };

  return (
    <div className="card p-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          İpoteka pre-approval (Mənə nə qədər mənzil əlçatandır?)
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <Field label="Aylıq gəliriniz (₼)" value={income} setValue={setIncome} />
          <Field label="Aylıq xərciniz (₼)" value={expenses} setValue={setExpenses} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasLoans} onChange={(e) => setHasLoans(e.target.checked)} />
            Mövcud başqa kreditim var
          </label>
          <button onClick={check} className="btn-tap w-full text-sm">
            <Calculator className="w-4 h-4" /> Hesabla
          </button>
          {result && (
            <div className={`p-3 rounded-xl ${result.eligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              {result.eligible ? (
                <>
                  <div className="text-sm font-bold text-emerald-700 mb-1">✅ Siz uyğunsunuz</div>
                  <div className="text-xs space-y-0.5">
                    <div>Max kredit: <strong>{Number(result.max_loan).toLocaleString('az-AZ')} ₼</strong></div>
                    <div>İlkin ödəniş: <strong>{Number(result.suggested_down_payment).toLocaleString('az-AZ')} ₼</strong></div>
                    <div>Max əmlak qiyməti: <strong className="text-emerald-700">{Number(result.max_property_price).toLocaleString('az-AZ')} ₼</strong></div>
                    <div>Aylıq təhlükəsiz ödəniş: <strong>{Number(result.safe_monthly_payment).toLocaleString('az-AZ')} ₼</strong></div>
                  </div>
                  <p className="text-[10px] text-ink-500 mt-2">{result.note}</p>
                </>
              ) : (
                <div className="text-sm text-amber-700">Hesabınız ən azı 800 ₼ olmalıdır</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, setValue }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-700 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="input !py-2 !text-sm" />
    </div>
  );
}
