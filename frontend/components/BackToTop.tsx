'use client';
import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-24 z-30 w-12 h-12 rounded-full bg-tap text-white shadow-2xl flex items-center justify-center hover:scale-110 transition"
      aria-label="Yuxarı qayıt">
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
