'use client';

export default function OriginalsPage() {
  return (
    <div className="min-h-screen bg-cs-paper pt-24 md:pt-32 pb-12 container-page">
      <p className="cs-slug mb-2">Scene — the slate</p>
      <h1 className="font-heading text-cs-ink text-5xl md:text-6xl tracking-wide uppercase mb-4">
        Wanzami Originals
      </h1>
      <div className="inline-flex items-center gap-2 cs-border-thin px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-cs-rust animate-pulse" />
        <p className="text-cs-muted font-mono text-xs uppercase tracking-[0.08em]">Exclusive original content — coming soon</p>
      </div>
    </div>
  );
}
