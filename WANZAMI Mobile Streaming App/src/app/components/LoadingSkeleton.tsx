export function MovieCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36 h-52 bg-[#14141B] rounded-lg animate-pulse" />
  );
}

export function HeroSkeleton() {
  return (
    <div className="h-[500px] w-full bg-[#14141B] rounded-2xl animate-pulse" />
  );
}

export function LiveStreamSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 bg-[#14141B] rounded-xl overflow-hidden">
      <div className="aspect-video bg-[#1C1C25] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1C1C25] rounded animate-pulse" />
        <div className="h-3 bg-[#1C1C25] rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}
