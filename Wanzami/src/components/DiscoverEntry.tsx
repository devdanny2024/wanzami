import Link from 'next/link';
import { Slug } from './cs/kit';

/* Visible "Categories" entry on Home (proposal p.7: one clear entry).
   Three doors, each deep-links into the Discover page's matching tab. */
const DOORS = [
  { tab: 'language', label: 'Language', ask: 'What language do I want?' },
  { tab: 'genre', label: 'Genre', ask: 'What kind of story?' },
  { tab: 'collection', label: 'Collections', ask: 'What has Wanzami selected?' },
] as const;

export function DiscoverEntry() {
  return (
    <section aria-label="Browse by category" className="container-page mb-8 md:mb-10">
      <div className="mx-auto max-w-7xl cs-border bg-cs-panel p-5 cs-shadow md:flex md:items-center md:justify-between md:gap-8 md:p-6">
        <div className="mb-4 md:mb-0">
          <Slug className="mb-1.5">Scene 01 / Discovery</Slug>
          <h2 className="font-heading text-3xl uppercase leading-[0.95] tracking-wide text-cs-ink md:text-4xl">
            Find your next story
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:min-w-[34rem]">
          {DOORS.map((d, i) => (
            <Link
              key={d.tab}
              href={d.tab === 'language' ? '/discover' : `/discover?tab=${d.tab}`}
              className="group block cs-border bg-cs-paper px-4 py-3 transition-colors hover:bg-brand focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cs-rust"
            >
              <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-cs-muted group-hover:text-cs-ink">
                0{i + 1} / Discover
              </span>
              <span className="block font-heading text-2xl uppercase tracking-wide text-cs-ink">{d.label}</span>
              <span className="block text-xs text-cs-muted group-hover:text-cs-ink">{d.ask}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
