'use client';
import { useState } from 'react';
import { Box, X } from 'lucide-react';

export default function View360({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm w-full">
        <Box className="w-4 h-4" /> 360° Virtual tur
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-8 text-center relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-ink-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video bg-gradient-to-br from-tap to-violet-600 rounded-lg flex items-center justify-center text-white">
              <div className="text-center">
                <Box className="w-20 h-20 mx-auto mb-3 animate-pulse" />
                <h3 className="text-2xl font-bold">360° Virtual Tur</h3>
                <p className="text-sm opacity-80 mt-2">İki barmaqla fırladın, yaxınlaşdırmaq üçün scroll edin</p>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-3">Demo: gerçəkdə Pannellum və ya Marzipano viewer</p>
          </div>
        </div>
      )}
    </>
  );
}
