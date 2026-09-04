// `responsive` — header üçün: dar ekranda axtarış sahəsinə yer qalsın deyə logo kiçilir,
// ≥640px-dən sonra normal `md` ölçüsünə qayıdır.
export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'responsive' }) {
  const dim =
    size === 'sm' ? 'w-7 h-7'
    : size === 'lg' ? 'w-11 h-11'
    : size === 'responsive' ? 'w-8 h-8 sm:w-9 sm:h-9'
    : 'w-9 h-9';
  const text =
    size === 'sm' ? 'text-base'
    : size === 'lg' ? 'text-2xl'
    : size === 'responsive' ? 'text-lg sm:text-xl'
    : 'text-xl';
  const numSize =
    size === 'sm' ? 'text-[9px]'
    : size === 'lg' ? 'text-sm'
    : size === 'responsive' ? 'text-[10px] sm:text-[11px]'
    : 'text-[11px]';
  return (
    <span className="inline-flex items-center gap-2 select-none shrink-0">
      {/* Qradiyent hex-ləri brend nişanının özüdür (tema səthi deyil) — ona görə token yox, sabit rəng */}
      <span
        className={`${dim} relative rounded-xl flex items-center justify-center font-extrabold ${numSize} shadow-md`}
        style={{
          background: 'conic-gradient(from 0deg, #04E061, #00AAFF, #FF5C00, #965EEB, #04E061)',
        }}
      >
        {/* Daxili kvadrat header fonu ilə eyni tokendə qalmalıdır ki, halqa nazik görünsün */}
        <span className="absolute inset-[3px] rounded-[8px] bg-white dark:bg-ink-900 flex items-center justify-center">
          <span
            className="font-extrabold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #04E061, #00AAFF, #FF5C00)' }}
          >
            360
          </span>
        </span>
      </span>
      <span className={`${text} font-extrabold tracking-tight text-ink-900 dark:text-white leading-none whitespace-nowrap`}>
        tap<span className="text-tap">.az</span>
      </span>
    </span>
  );
}
