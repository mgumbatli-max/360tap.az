'use client';
import { useState } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { useToast } from '@/lib/toast';

export default function TestDriveBooking() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:00');
  const [phone, setPhone] = useState('');
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const submit = () => {
    if (!date || !time || !phone) return;
    toast.success(`Test sürüşü təyin edildi: ${date} saat ${time}`);
    setOpen(false);
    setDate(''); setTime('15:00'); setPhone('');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm w-full">
        <Calendar className="w-4 h-4 text-tap" /> Test sürüşü təyin et
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-[#1c2128] rounded-2xl max-w-md w-full p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-tap" /> Test sürüşü</h2>
              <button onClick={() => setOpen(false)} className="w-7 h-7 hover:bg-ink-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-500">Tarix</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Saat</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500">Telefon</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 123 45 67" className="input" />
              </div>
            </div>
            <button onClick={submit} className="btn-tap w-full mt-4">
              <Check className="w-4 h-4" /> Təsdiqlə
            </button>
          </div>
        </div>
      )}
    </>
  );
}
