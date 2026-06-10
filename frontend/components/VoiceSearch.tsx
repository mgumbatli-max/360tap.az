'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';

type Status = 'idle' | 'listening' | 'parsing' | 'done';

export default function VoiceSearch({ onResult }: { onResult?: (text: string) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<Status>('idle');
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Brauzeriniz səs tanımanı dəstəkləmir (Safari/Chrome dəstəkləyir)');
      return;
    }
    if (status === 'listening') {
      recRef.current?.stop();
      return;
    }

    setTranscript('');
    setParsed(null);
    setShowOverlay(true);

    const r = new SR();
    r.lang = 'az-AZ';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => setStatus('listening');

    r.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join(' ');
      setTranscript(text);
    };

    r.onerror = (e: any) => {
      const err = e.error || 'naməlum';
      if (err === 'no-speech') {
        toast.warning('Səs alınmadı, daha yüksək danışın');
      } else if (err === 'not-allowed') {
        toast.error('Mikrofon icazəsi verilməyib');
      } else {
        toast.error('Səs tanına bilmədi');
      }
      setStatus('idle');
      setShowOverlay(false);
    };

    r.onend = async () => {
      const finalText = transcript.trim();
      if (!finalText) {
        setStatus('idle');
        setShowOverlay(false);
        return;
      }

      setStatus('parsing');
      try {
        const result = await api<{ filters: any; suggestion: string; url: string }>(
          '/voice/parse',
          { method: 'POST', body: JSON.stringify({ text: finalText }) }
        );
        setParsed(result);
        setStatus('done');
        toast.success(result.suggestion);

        // 1.5 saniyə sonra avtomatik gedir
        setTimeout(() => {
          if (onResult) {
            onResult(finalText);
          } else if (result.url) {
            router.push(result.url);
          }
          setShowOverlay(false);
          setStatus('idle');
        }, 1500);
      } catch (err: any) {
        toast.error('AI parsinq xətası');
        setStatus('idle');
        setShowOverlay(false);
      }
    };

    recRef.current = r;
    try {
      r.start();
    } catch {
      toast.error('Mikrofon başladıla bilmədi');
      setStatus('idle');
      setShowOverlay(false);
    }
  };

  const goNow = () => {
    if (parsed?.url) {
      router.push(parsed.url);
      setShowOverlay(false);
      setStatus('idle');
    }
  };

  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
          status === 'listening'
            ? 'bg-red-500 text-white scale-110 animate-pulse'
            : 'hover:bg-tap-50 text-tap'
        }`}
        aria-label="Səs ilə axtar"
        title="🎙 Səslə danışıb axtar"
      >
        {status === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Voice overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            recRef.current?.stop();
            setShowOverlay(false);
            setStatus('idle');
          }}
        >
          <div
            className="bg-white dark:bg-[#1c2128] rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulsing mic */}
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
                status === 'done' ? 'bg-emerald-500 text-white' :
                'bg-ink-100 text-ink-500'
              }`}>
                {status === 'parsing' ? <Loader2 className="w-12 h-12 animate-spin" /> :
                 status === 'done' ? <Sparkles className="w-12 h-12" /> :
                 <Mic className="w-12 h-12" />}
              </div>
            </div>

            <h3 className="text-xl font-bold text-ink-900 mb-2">
              {status === 'listening' && '🎙 Sizi dinləyirəm...'}
              {status === 'parsing' && '🤖 AI anlayır...'}
              {status === 'done' && '✓ Hazırdır!'}
            </h3>

            {transcript && (
              <p className="text-lg font-medium text-ink-700 mt-4 px-4 py-3 bg-ink-50 rounded-xl">
                "{transcript}"
              </p>
            )}

            {parsed && (
              <div className="mt-4 space-y-3">
                <div className="text-sm text-tap font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {parsed.suggestion}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {Object.entries(parsed.filters || {}).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 rounded-full bg-tap-50 text-tap text-xs font-semibold">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
                <button onClick={goNow} className="btn-tap w-full">
                  Nəticələrə bax →
                </button>
              </div>
            )}

            {!transcript && status === 'listening' && (
              <p className="text-sm text-ink-500 mt-3">
                Misal: "Bakıda 2018-ci ildən sonra BMW tap"
              </p>
            )}

            {status === 'listening' && (
              <button onClick={() => recRef.current?.stop()} className="text-sm text-ink-500 hover:text-ink-900 mt-4">
                Dayandır
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
