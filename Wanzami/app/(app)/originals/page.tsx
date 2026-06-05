'use client';

export default function OriginalsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 md:pt-32 pb-12 container-page">
      <h1 className="font-heading text-foreground text-5xl md:text-6xl tracking-wide uppercase mb-4">
        Wanzami Originals
      </h1>
      <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
        <p className="text-ash text-sm">Exclusive original content — coming soon</p>
      </div>
    </div>
  );
}
