export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16 space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="aspect-[2/3] bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
          <span className="text-white/60 text-sm">{title}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="aspect-[2/3] bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageBlockSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-16 h-16 border-2 border-white/40 border-t-white rounded-full animate-spin" />
    </div>
  );
}
