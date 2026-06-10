export default function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="aspect-square skeleton mb-3" />
          <div className="h-5 skeleton mb-2 w-2/3" />
          <div className="h-4 skeleton w-full" />
          <div className="h-3 skeleton mt-2 w-1/3" />
        </div>
      ))}
    </div>
  );
}
