export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const numSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-sm' : 'text-[11px]';
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className={`${dim} relative rounded-xl flex items-center justify-center font-extrabold ${numSize} shadow-md`}
        style={{
          background: 'conic-gradient(from 0deg, #04E061, #00AAFF, #FF5C00, #965EEB, #04E061)',
        }}
      >
        <span className="absolute inset-[3px] rounded-[8px] bg-white dark:bg-[#161b22] flex items-center justify-center">
          <span
            className="font-extrabold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #04E061, #00AAFF, #FF5C00)' }}
          >
            360
          </span>
        </span>
      </span>
      <span className={`${text} font-extrabold tracking-tight text-ink-900 leading-none`}>
        tap<span className="text-tap">.az</span>
      </span>
    </span>
  );
}
