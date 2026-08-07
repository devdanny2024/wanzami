'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { fetchTitles, type Title } from "@/lib/contentClient";
import { Logo } from "./_components/kit";

const APPLY_HREF = "/creators/apply";

// Call-sheet palette. Deliberately NOT the streaming app's black — this page is paper.
const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

function Slug({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] sm:text-xs tracking-[0.08em] text-[#6b5f4d] uppercase">{children}</p>
  );
}

function Sticker({ children, rotate = 2.5 }: { children: React.ReactNode; rotate?: number }) {
  return (
    <span
      className="inline-block bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#161310] shadow-[3px_3px_0_#161310] transition-transform duration-200 hover:rotate-0"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block border-[2.5px] border-[#d1490f] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#d1490f]"
      style={{ transform: "rotate(-6deg)" }}
    >
      {children}
    </span>
  );
}

function Sprockets() {
  return (
    <div aria-hidden="true" className="flex justify-between gap-2 px-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="h-3.5 w-2.5 rounded-[2px] bg-[#f2ead9]" />
      ))}
    </div>
  );
}

function FilmFrame({ title }: { title: Title }) {
  const art = title.thumbnailUrl || title.posterUrl;
  return (
    <div className="relative h-24 w-40 sm:h-32 sm:w-56 shrink-0 overflow-hidden bg-[#2a241d]">
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt={title.name} className="h-full w-full object-cover" loading="lazy" />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5">
        <p className="line-clamp-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f2ead9]">
          {title.name}
        </p>
      </div>
    </div>
  );
}

const invoice = [
  { item: "Pay-per-view — you set the ticket", rate: "₦1,500 × 1,000 = ₦1.5M gross*" },
  { item: "Wanzami Originals commission", rate: "FUNDED BY US" },
  { item: "Distribution — web, mobile, smart TV", rate: "INCLUDED" },
  { item: "Live premiere on release night", rate: "INCLUDED" },
];

const kit = [
  "Creator Hub dashboard — uploads, artwork, release windows",
  "4K transcoding to every rendition, handled for you",
  "Analytics that matter: watch time, completion, buys",
  "Coming Soon scheduling and hero placement",
  "Payouts in naira via Paystack and Flutterwave",
  "Stream-level piracy protection",
];

const shots = [
  { n: "01", t: "Join", d: "Create your account in a minute. No waiting on a yes." },
  { n: "02", t: "Submit", d: "Upload your reel, your short, or the film that got rejected everywhere else. We review it, not you." },
  { n: "03", t: "Release", d: "Your price, your countries, your date. Tease it with Coming Soon." },
  { n: "04", t: "Get paid", d: "Every buy tracked. Every payout in naira." },
];

export default function CreatorsPage() {
  const [titles, setTitles] = useState<Title[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTitles("NG");
        if (mounted) setTitles(data.filter((t) => !t.archived && (t.posterUrl || t.thumbnailUrl)));
      } catch {
        // Film strip simply stays empty; the paper still reads.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const reel = useMemo(() => (titles.length ? [...titles, ...titles] : []), [titles]);

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      {/* Production strip */}
      <header
        className="sticky top-0 z-50 border-b-[3px]"
        style={{ backgroundColor: PAPER, borderColor: INK }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/splash" className="inline-flex items-center gap-2.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em]">
            <Logo className="h-6 w-auto" />
            Wanzami Pictures — Production Office
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/creators/login"
              className="hidden font-mono text-[11px] uppercase tracking-widest sm:inline-block border-[1.5px] px-2 py-0.5"
              style={{ borderColor: INK }}
            >
              Creator login
            </Link>
            <a
              href={APPLY_HREF}
              className="inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-sm font-bold text-[#f2ead9] transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: INK }}
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* SCENE 01 — the pitch */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <Slug>Scene 01 — INT. Your imagination — day. Talent: you.</Slug>
          <div className="relative mt-4">
            <h1 className="font-heading uppercase leading-[0.85] tracking-wide text-[22vw] sm:text-[9rem] lg:text-[11rem]">
              Shoot
              <br />
              your <span style={{ color: RUST }}>shot.</span>
            </h1>
            <div className="absolute right-0 top-1 hidden sm:block">
              <Sticker>Now casting: directors</Sticker>
            </div>
          </div>
          <div className="mt-4 sm:hidden">
            <Sticker>Now casting: directors</Sticker>
          </div>
          <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-[#3c342a]">
            Wanzami is where unconventional African filmmakers stop asking permission. Too bold, too local,
            too strange, too true? That is the brief. Bring the film only you could make — we bring the
            audience and the payout.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={APPLY_HREF}
              className="inline-flex min-h-[52px] items-center gap-2 px-8 py-3.5 text-base font-bold text-[#f2ead9] shadow-[5px_5px_0_#161310] transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: RUST }}
            >
              Create account
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/splash"
              className="inline-flex min-h-[52px] items-center border-[2.5px] px-6 py-3.5 text-base font-bold transition-colors hover:bg-[#161310] hover:text-[#f2ead9]"
              style={{ borderColor: INK }}
            >
              See what&rsquo;s streaming
            </Link>
            <Stamp>Approved</Stamp>
          </div>
        </section>

        {/* REEL A — film strip of real catalog */}
        <section className="border-y-[3px] py-3" style={{ backgroundColor: INK, borderColor: INK }}>
          <Sprockets />
          {reel.length > 0 ? (
            <div className="my-2 overflow-hidden">
              <div className="creators-marquee flex w-max gap-2 px-3">
                {reel.map((t, i) => (
                  <FilmFrame key={`${t.id}-${i}`} title={t} />
                ))}
              </div>
            </div>
          ) : (
            <div className="my-2 h-24 sm:h-32" />
          )}
          <Sprockets />
          <p className="px-4 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#b7a88e]">
            Reel A — shot on Wanzami. Real films, pulled live from the catalog.
          </p>
        </section>

        {/* SCENE 02 — the money */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Slug>Scene 02 — the money</Slug>
          <h2 className="mt-3 font-heading text-5xl uppercase leading-[0.9] tracking-wide sm:text-7xl">
            Invoice: paid to <span style={{ color: RUST }}>the filmmaker</span>
          </h2>
          <div
            className="mt-10 border-[2.5px] shadow-[6px_6px_0_#161310]"
            style={{ borderColor: INK, backgroundColor: PANEL }}
          >
            <div className="flex items-center justify-between border-b-2 px-4 py-3 sm:px-6" style={{ borderColor: INK }}>
              <span className="text-sm font-bold uppercase tracking-wider">Item</span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Rate</span>
            </div>
            {invoice.map((row, i) => (
              <div
                key={row.item}
                className={`flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                  i < invoice.length - 1 ? "border-b border-dashed border-[#161310]/60" : ""
                }`}
              >
                <span className="text-[15px]">{row.item}</span>
                <span className="font-mono text-sm tabular-nums" style={{ color: i === 0 ? RUST : INK }}>
                  {row.rate}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[#6b5f4d]">
            *Illustrative. Transparent revenue share, paid out in naira.
          </p>
        </section>

        {/* SCENE 03 + 04 — the kit and the shoot */}
        <section className="border-t-[3px]" style={{ borderColor: INK }}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <Slug>Scene 03 — the kit</Slug>
              <h2 className="mt-3 font-heading text-4xl uppercase tracking-wide sm:text-6xl">Gear checklist</h2>
              <ul className="mt-8 space-y-4">
                {kit.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-snug">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2"
                      style={{ borderColor: INK }}
                    >
                      <Check className="h-4 w-4" style={{ color: RUST }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pt-10">
              <div
                className="border-[2.5px] p-6 shadow-[6px_6px_0_#161310] transition-transform duration-300 hover:rotate-0 sm:p-8"
                style={{ borderColor: INK, backgroundColor: PANEL, transform: "rotate(1.2deg)" }}
              >
                <Slug>Scene 04 — the shoot</Slug>
                <h3 className="mt-2 font-heading text-3xl uppercase tracking-wide sm:text-4xl">Shot list</h3>
                <ol className="mt-6 space-y-5">
                  {shots.map((s) => (
                    <li key={s.n} className="flex gap-4">
                      <span className="font-heading text-3xl leading-none" style={{ color: RUST }}>
                        {s.n}
                      </span>
                      <div>
                        <p className="font-bold">
                          {s.n === "04" ? <span className="bg-brand px-1.5 py-0.5">{s.t}</span> : s.t}
                        </p>
                        <p className="mt-1 text-sm text-[#3c342a]">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Manifesto interstitial */}
        <section className="border-y-[3px] py-14" style={{ backgroundColor: INK, borderColor: INK }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-heading text-4xl uppercase leading-[0.95] tracking-wide text-[#f2ead9] sm:text-6xl">
              The industry calls it <span className="bg-brand px-2 text-[#161310]">&ldquo;too risky.&rdquo;</span>
              <br />
              We call it a slate.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-[#b7a88e]">
              No gatekeeping. No formula notes. No waiting three years for a yes.
            </p>
          </div>
        </section>

        {/* CUT TO: YOU — signature CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Slug>Cut to: you. Sign the slate.</Slug>
          <div className="mt-8 flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div
                className="w-64 border-b-2 border-dashed pb-1 text-2xl text-[#3c342a]"
                style={{ borderColor: INK, fontFamily: "cursive" }}
              >
                Your name here
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6b5f4d]">
                Director / signature
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <a
                href={APPLY_HREF}
                className="inline-flex min-h-[56px] items-center gap-2 px-10 py-4 text-lg font-bold text-[#f2ead9] shadow-[6px_6px_0_#161310] transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: RUST }}
              >
                Create account
                <ArrowRight className="h-5 w-5" />
              </a>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6b5f4d]">creators@wanzami.tv</p>
            </div>
          </div>
        </section>

        {/* End credits roll into the dark footer */}
        <div className="border-t-[3px] py-6 text-center" style={{ backgroundColor: INK, borderColor: INK }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#b7a88e]">
            End of call sheet — roll credits
          </p>
        </div>
      </main>

      <div style={{ backgroundColor: "#000" }}>
        <Footer />
      </div>
    </div>
  );
}
