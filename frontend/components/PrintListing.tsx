'use client';
import { Printer, Download } from 'lucide-react';

export default function PrintListing({ listing }: { listing: any }) {
  const print = () => window.print();
  return (
    <div className="grid grid-cols-2 gap-2">
      <button onClick={print} className="btn-secondary text-xs">
        <Printer className="w-3.5 h-3.5" /> Çap et
      </button>
      <button onClick={print} className="btn-secondary text-xs">
        <Download className="w-3.5 h-3.5" /> PDF
      </button>
    </div>
  );
}
