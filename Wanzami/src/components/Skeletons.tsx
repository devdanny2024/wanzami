import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16 space-y-6">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
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
          <Skeleton className="h-8 w-32 rounded" />
          <span className="text-white/60 text-sm">{title}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageBlockSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <Skeleton className="h-16 w-16 rounded-full" />
    </div>
  );
}
