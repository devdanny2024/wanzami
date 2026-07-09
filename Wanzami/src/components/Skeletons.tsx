import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink">
      {/* Hero placeholder — editorial split */}
      <div className="container-page pt-4 pb-10 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5 order-2 lg:order-1">
          <Skeleton className="!bg-cs-line h-5 w-40 rounded-none" />
          <Skeleton className="!bg-cs-line h-16 w-3/4 rounded-none" />
          <Skeleton className="!bg-cs-line h-6 w-52 rounded-none" />
          <Skeleton className="!bg-cs-line h-16 w-full max-w-md rounded-none" />
          <div className="flex gap-3">
            <Skeleton className="!bg-cs-line h-12 w-36 rounded-none" />
            <Skeleton className="!bg-cs-line h-12 w-36 rounded-none" />
          </div>
        </div>
        <Skeleton className="!bg-cs-line order-1 lg:order-2 aspect-[16/10] w-full rounded-none" />
      </div>
      <div className="relative z-10 pb-12 space-y-8 md:space-y-10">
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="space-y-3 md:space-y-4">
            <Skeleton className="!bg-cs-line container-page h-8 w-48 rounded-none" />
            <div className="flex gap-3 md:gap-4 overflow-hidden px-4 sm:px-6 lg:px-10">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-none w-[44%] sm:w-[32%] md:w-[26%] lg:w-[22%] xl:w-[18.5%] 2xl:w-[15.5%] cs-border-thin bg-cs-panel p-2 sm:p-2.5 space-y-2.5"
                >
                  <Skeleton className="!bg-cs-line aspect-video w-full rounded-none" />
                  <Skeleton className="!bg-cs-line h-4 w-3/4 rounded-none" />
                  <Skeleton className="!bg-cs-line h-3 w-1/2 rounded-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="mb-8 md:mb-10">
      <Skeleton className="!bg-cs-line container-page h-8 w-48 rounded-none mb-3 md:mb-4" />
      <div className="mx-auto w-full max-w-[96rem] flex gap-3 md:gap-4 overflow-hidden px-4 sm:px-6 lg:px-10 2xl:px-12">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex-none w-[44%] sm:w-[32%] md:w-[26%] lg:w-[22%] xl:w-[18.5%] 2xl:w-[15.5%] cs-border-thin bg-cs-panel p-2 sm:p-2.5 space-y-2.5"
          >
            <Skeleton className="!bg-cs-line aspect-video w-full rounded-none" />
            <Skeleton className="!bg-cs-line h-4 w-3/4 rounded-none" />
            <Skeleton className="!bg-cs-line h-3 w-1/2 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink">
      <div className="pt-24 md:pt-32 pb-12 container-page space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="!bg-cs-line h-9 w-40 rounded-none" />
          <span className="text-cs-muted font-mono text-xs uppercase tracking-[0.1em]">{title}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-2">
              <Skeleton className="!bg-cs-line aspect-video w-full rounded-none" />
              <Skeleton className="!bg-cs-line h-4 w-3/4 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageBlockSkeleton() {
  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink flex items-center justify-center">
      <Skeleton className="!bg-cs-line h-16 w-16 rounded-full" />
    </div>
  );
}
