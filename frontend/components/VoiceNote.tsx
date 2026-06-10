'use client';
import { useState } from 'react';
import { Mic, Play, Pause, Trash2 } from 'lucide-react';

export default function VoiceNote() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (recording) {
      setRecording(false);
      setHasAudio(true);
    } else {
      setRecording(true);
      setDuration(0);
      const t = setInterval(() => setDuration((d) => d >= 60 ? (clearInterval(t), d) : d + 1), 1000);
    }
  };

  return (
    <div className="card p-4">
      <h3 className="font-bold flex items-center gap-2 mb-3"><Mic className="w-4 h-4 text-tap" /> Səsli mesaj əlavə et</h3>
      <p className="text-xs text-ink-500 mb-3">Elana 60 saniyəlik səsli təqdimat əlavə edin</p>
      {!hasAudio ? (
        <button onClick={toggle}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            recording ? 'bg-red-500 text-white animate-pulse' : 'bg-tap text-white hover:bg-tap-dark'
          }`}>
          <Mic className="w-5 h-5" /> {recording ? `Yazılır... ${duration}s` : 'Yazmağa başla'}
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-tap-50 rounded-lg">
          <button onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full bg-tap text-white flex items-center justify-center">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1 h-2 bg-ink-200 rounded-full"><div className="h-full bg-tap rounded-full" style={{ width: '40%' }} /></div>
          <span className="text-xs font-mono">{duration}s</span>
          <button onClick={() => { setHasAudio(false); setDuration(0); }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
