import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero placeholder */}
      <Skeleton className="h-[70vh] min-h-[460px] sm:h-[80vh] md:h-[92vh] w-full rounded-none" />
      <div className="relative -mt-16 sm:-mt-20 md:-mt-28 z-10 pb-12 space-y-8 md:space-y-10">
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="space-y-3 md:space-y-4">
            <Skeleton className="container-page h-8 w-48 rounded" />
            <div className="flex gap-3 md:gap-4 overflow-hidden px-4 sm:px-6 lg:px-10">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-none w-[44%] sm:w-[32%] md:w-[26%] lg:w-[22%] xl:w-[18.5%] 2xl:w-[15.5%] rounded-2xl border border-white/10 bg-graphite p-2 sm:p-2.5 space-y-2.5"
                >
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pt-24 md:pt-32 pb-12 container-page space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40 rounded" />
          <span className="text-ash text-sm">{title}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-2">
              <Skeleton className="aspect-video w-full rounded-xl" />
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <Skeleton className="h-16 w-16 rounded-full" />
    </div>
  );
}
