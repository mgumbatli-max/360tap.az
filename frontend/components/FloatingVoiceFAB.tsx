'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Sparkles, Loader2, X } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';

type Status = 'idle' | 'listening' | 'parsing' | 'done';

const COMMANDS: Array<{ patterns: RegExp[]; route: string; label: string }> = [
  { patterns: [/yeni elan|elan yerleşdir|elan yarat/i], route: '/elan-yerlesdir', label: 'Elan yerləşdir' },
  { patterns: [/sevimli|favorit/i], route: '/profil/sevimliler', label: 'Sevimlilər' },
  { patterns: [/mesaj|chat|söhbət/i], route: '/profil/mesajlar', label: 'Mesajlar' },
  { patterns: [/profil|kabinet/i], route: '/profil', label: 'Profil' },
  { patterns: [/səbət|alış-veriş/i], route: '/profil/sebet', label: 'Səbət' },
  { patterns: [/elanlarım|mənim elanlarım/i], route: '/profil/elanlarim', label: 'Elanlarım' },
  { patterns: [/ana səhifə|baş səhifə/i], route: '/', label: 'Ana səhifə' },
];

export default function FloatingVoiceFAB() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Brauzeriniz səs tanımanı dəstəkləmir');
      return;
    }
    if (status === 'listening') {
      recRef.current?.stop();
      return;
    }
    setTranscript('');
    transcriptRef.current = '';
    setParsed(null);
    setShowOverlay(true);

    const r = new SR();
    r.lang = 'az-AZ';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => setStatus('listening');
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join(' ');
      setTranscript(text);
      transcriptRef.current = text;
    };
    r.onerror = (e: any) => {
      const err = e.error || 'naməlum';
      toast.error(err === 'no-speech' ? 'Səs alınmadı' :
                  err === 'not-allowed' ? 'Mikrofon icazəsi yoxdur' : 'Səs xətası');
      setStatus('idle');
      setShowOverlay(false);
    };
    r.onend = async () => {
      const finalText = transcriptRef.current.trim();
      if (!finalText) {
        setStatus('idle'); setShowOverlay(false); return;
      }
      // Naviqasiya komandası mı?
      for (const cmd of COMMANDS) {
        if (cmd.patterns.some(p => p.test(finalText))) {
          toast.success(`Komanda: ${cmd.label}`);
          router.push(cmd.route);
          setShowOverlay(false);
          setStatus('idle');
          return;
        }
      }
      // Axtarış komandası
      setStatus('parsing');
      try {
        const result = await api<any>('/voice/parse', { method: 'POST', body: JSON.stringify({ text: finalText }) });
        setParsed(result);
        setStatus('done');
        toast.success(result.suggestion);
        setTimeout(() => {
          if (result.url) router.push(result.url);
          setShowOverlay(false);
          setStatus('idle');
        }, 1500);
      } catch {
        toast.error('AI parsinq xətası');
        setStatus('idle'); setShowOverlay(false);
      }
    };

    recRef.current = r;
    try { r.start(); }
    catch { toast.error('Mikrofon başladıla bilmədi'); setStatus('idle'); setShowOverlay(false); }
  };

  if (!supported) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={start}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${
          status === 'listening' ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-br from-tap to-violet-600 text-white'
        }`}
        aria-label="Səslə danış"
        title="🎙 AI ilə səsli axtarış / komanda"
      >
        {status === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-white flex items-center justify-center shadow">AI</span>
      </button>

      {/* Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { recRef.current?.stop(); setShowOverlay(false); setStatus('idle'); }}
        >
          <div className="bg-white dark:bg-[#1c2128] rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="relative w-32 h-32 mx-auto mb-6">
              {status === 'listening' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-tap/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-tap/40 animate-ping" style={{ animationDelay: '0.2s' }} />
                </>
              )}
              <div className={`absolute inset-4 rounded-full flex items-center justify-center ${
                status === 'listening' ? 'bg-tap text-white' :
                status === 'parsing' ? 'bg-amber-500 text-white' :
                status === 'done' ? 'bg-emerald-500 text-white' : 'bg-ink-100'
              }`}>
                {status === 'parsing' ? <Loader2 className="w-12 h-12 animate-spin" /> :
                 status === 'done' ? <Sparkles className="w-12 h-12" /> :
                 <Mic className="w-12 h-12" />}
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">
              {status === 'listening' && '🎙 Sizi dinləyirəm...'}
              {status === 'parsing' && '🤖 AI anlayır...'}
              {status === 'done' && '✓ Hazırdır!'}
            </h3>
            {transcript && (
              <p className="text-lg font-medium px-4 py-3 bg-ink-50 dark:bg-ink-800 rounded-xl mt-4">"{transcript}"</p>
            )}
            {parsed && (
              <div className="mt-4 text-sm text-tap font-bold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> {parsed.suggestion}
              </div>
            )}
            {!transcript && status === 'listening' && (
              <p className="text-sm text-ink-500 mt-3">
                Misallar: "BMW axtar", "yeni elan", "favoritlərim"
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
