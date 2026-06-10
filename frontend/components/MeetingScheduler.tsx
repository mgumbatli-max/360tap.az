'use client';
import { useState } from 'react';
import { Calendar, MapPin, Clock, Send, X } from 'lucide-react';

export default function MeetingScheduler({ onSchedule }: { onSchedule: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:00');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !place) return;
    const d = new Date(`${date}T${time}`);
    const formatted = `📅 Görüş təklifim:\n• Tarix: ${d.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}\n• Saat: ${time}\n• Yer: ${place}${note ? `\n• Qeyd: ${note}` : ''}\n\nUyğundursa təsdiq edin 🙂`;
    onSchedule(formatted);
    setOpen(false);
    setDate(''); setTime('15:00'); setPlace(''); setNote('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-ink-100 rounded-lg text-ink-600"
        aria-label="Görüş təyin et"
        title="Görüş təyin et"
      >
        <Calendar className="w-5 h-5 text-violet-500" />
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-violet-500" />
              Görüş təyin et
            </h2>
            <p className="text-sm text-ink-500 mb-4">Müştəri ilə vaxt və yer razılaşdır</p>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" /> Tarix və saat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required className="input" />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="input" />
                </div>
                <div className="flex gap-2 mt-2 text-xs">
                  <button type="button" onClick={() => setDate(today)} className="text-tap hover:underline">Bu gün</button>
                  <button type="button" onClick={() => setDate(tomorrow)} className="text-tap hover:underline">Sabah</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" /> Görüş yeri
                </label>
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="məs: 28 May metro yanı"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Əlavə qeyd (opsional)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="məs: dəfələrlə zəng vurmadan gəlin"
                  className="input"
                />
              </div>

              <button type="submit" className="btn-tap w-full">
                <Send className="w-4 h-4" /> Görüş təklifini göndər
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
