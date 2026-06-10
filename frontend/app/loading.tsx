export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton aspect-square" />
              <div className="skeleton h-5 w-20" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
