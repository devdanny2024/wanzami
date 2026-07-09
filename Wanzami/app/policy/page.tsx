import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wanzami Policies',
  description: 'Terms of use, privacy policy, and frequently asked questions for Wanzami.',
};

const termsCopy =
  'By using Wanzami, you agree to access content for personal, non-commercial use only. Creators retain full rights to their content. Any unauthorized copying, sharing, or distribution is prohibited. We reserve the right to suspend accounts that violate these terms.';

const privacyCopy =
  'We respect your privacy. Wanzami only collects necessary data to improve user experience and ensure secure payments. We do not sell or share your information with third parties without your consent.';

const sectionLinks = [
  { id: 'terms', label: 'Terms of Use' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

const faqs = [
  {
    question: 'How does Wanzami work?',
    answer: 'You pay only for what you watch—no subscriptions. Stream any movie or series instantly.',
  },
  {
    question: 'Do I need an account to watch?',
    answer:
      'Yes. Creating a free account helps us keep your content secure and your experience personal.',
  },
  {
    question: 'How do filmmakers earn?',
    answer: 'Creators earn a share of every view. Wanzami is built to support storytellers from day one.',
  },
  {
    question: 'What kind of content is on Wanzami?',
    answer:
      'Original, independent films, documentaries, and series from creatives worldwide—bold, diverse, and authentic.',
  },
  {
    question: 'Is Wanzami available worldwide?',
    answer: 'Yes, our content is accessible globally.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Request account deletion through our support team and we will process it within 14 days.',
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.28em] text-cs-rust">
      {children}
    </p>
  );
}

function PullQuote({ title, quote }: { title: string; quote: string }) {
  return (
    <aside className="rounded-[24px] border border-cs-ink border-l-4 border-l-brand bg-cs-panel p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-cs-rust">{title}</p>
      <p className="mt-3 text-lg leading-8 text-cs-ink sm:text-xl">{quote}</p>
    </aside>
  );
}

export default function PolicyPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen scroll-smooth bg-cs-paper text-cs-ink cs-paper-root">
      <header className="sticky top-0 z-50 border-b-[3px] border-cs-ink bg-cs-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group inline-flex flex-col items-start leading-none">
            <span className="font-heading text-2xl tracking-wide text-cs-ink">WANZAMI</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cs-muted -mt-0.5">Policy Center</span>
            <span className="sr-only">Wanzami home</span>
          </Link>

          <nav aria-label="Policy sections" className="flex items-center gap-2 text-sm text-cs-muted">
            {sectionLinks.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/policy#${item.id}`}
                className="rounded-full border border-transparent px-3 py-2 transition-all duration-300 hover:border-cs-ink hover:bg-white/5 hover:text-cs-ink sm:px-4"
              >
                {item.label === 'Terms of Use' ? 'Terms' : item.label === 'Privacy Policy' ? 'Privacy' : item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-cs-ink">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(253,126,20,0.14),_transparent_42%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="fade-up max-w-4xl">
            <div className="inline-flex items-center rounded-full cs-border-thin bg-cs-panel px-4 py-2 text-xs uppercase tracking-[0.28em] text-cs-rust backdrop-blur">
              Wanzami Policy Center
            </div>

            <h1 className="font-heading mt-6 max-w-4xl text-5xl uppercase leading-[0.92] tracking-[0.04em] text-cs-ink sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Clear Rules. No Surprises.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-cs-muted sm:text-lg">
              Everything you need to know about how Wanzami protects your access, your privacy,
              and every pay-per-view moment across a new generation of independent African film.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/policy#terms"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-3 text-sm font-semibold text-cs-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_16px_32px_rgba(253,126,20,0.28)]"
              >
                Read the terms
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-cs-ink bg-cs-panel px-6 py-3 text-sm font-medium text-cs-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-cs-rust hover:bg-cs-paper"
              >
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="fade-up lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: '0.12s' }}>
          <div className="rounded-[28px] border border-cs-ink bg-cs-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <p className="text-xs uppercase tracking-[0.26em] text-cs-rust">Navigate</p>
            <nav className="mt-5 space-y-2" aria-label="Policy page navigation">
              {sectionLinks.map((item) => (
                <Link
                  key={item.id}
                  href={`/policy#${item.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-transparent bg-cs-panel px-4 py-3 text-sm text-cs-muted transition-all duration-300 hover:border-cs-rust hover:bg-cs-paper hover:text-cs-ink"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-brand transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-[22px] border border-cs-ink bg-cs-panel p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cs-rust">Quick note</p>
              <p className="mt-3 text-sm leading-7 text-cs-muted">
                Wanzami is built for direct, transparent access to stories that deserve a global
                audience.
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-8 md:space-y-10">
          <section
            id="terms"
            className="fade-up scroll-mt-28 rounded-[32px] border border-cs-ink bg-cs-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10"
            style={{ animationDelay: '0.18s' }}
          >
            <SectionEyebrow>Terms of Use</SectionEyebrow>
            <h2 className="font-heading mt-3 text-4xl uppercase tracking-[0.05em] text-cs-ink sm:text-5xl">
              Watch responsibly.
            </h2>
            <div className="mt-8 grid gap-6">
              <div className="rounded-[24px] border border-cs-ink bg-cs-paper p-6 sm:p-7">
                <p className="text-base leading-8 text-cs-muted sm:text-lg">{termsCopy}</p>
              </div>
              <PullQuote
                title="Key point"
                quote="Access on Wanzami is personal, limited to non-commercial viewing, and designed to protect every creator’s rights."
              />
            </div>
          </section>

          <section
            id="privacy"
            className="fade-up scroll-mt-28 rounded-[32px] border border-cs-ink bg-cs-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10"
            style={{ animationDelay: '0.28s' }}
          >
            <SectionEyebrow>Privacy Policy</SectionEyebrow>
            <h2 className="font-heading mt-3 text-4xl uppercase tracking-[0.05em] text-cs-ink sm:text-5xl">
              Your data stays respected.
            </h2>
            <div className="mt-8 grid gap-6">
              <div className="rounded-[24px] border border-cs-ink bg-cs-paper p-6 sm:p-7">
                <p className="text-base leading-8 text-cs-muted sm:text-lg">{privacyCopy}</p>
              </div>
              <PullQuote
                title="Privacy promise"
                quote="We only collect what we need to improve your experience and secure your payments—nothing more."
              />
            </div>
          </section>

          <section
            id="faq"
            className="fade-up scroll-mt-28 rounded-[32px] border border-cs-ink bg-cs-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10"
            style={{ animationDelay: '0.38s' }}
          >
            <SectionEyebrow>FAQ</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-4xl uppercase tracking-[0.05em] text-cs-ink sm:text-5xl">
                  The essentials.
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-8 text-cs-muted sm:text-lg">
                  Six quick answers covering access, creators, global viewing, and account support.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqs.map((item, index) => (
                <article
                  key={item.question}
                  className="group rounded-[26px] border border-cs-ink bg-cs-paper p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cs-rust hover:bg-cs-paper"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-5xl leading-none text-brand/80">
                        {(index + 1).toString().padStart(2, '0')}
                      </p>
                      <h3 className="mt-4 text-xl font-medium text-cs-ink">{item.question}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-cs-muted sm:text-base">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="contact"
            className="fade-up scroll-mt-28 overflow-hidden rounded-[32px] border border-brand/40 bg-[linear-gradient(135deg,rgba(253,126,20,0.16),rgba(26,26,26,0.98)_38%,rgba(26,26,26,1)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8 lg:p-10"
            style={{ animationDelay: '0.48s' }}
          >
            <SectionEyebrow>Contact</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-heading text-4xl uppercase tracking-[0.05em] text-cs-ink sm:text-5xl">
                  Need a human answer?
                </h2>
                <p className="mt-4 text-base leading-8 text-cs-muted sm:text-lg">
                  If you have questions about account access, payments, privacy, or content usage,
                  our team is ready to help.
                </p>
              </div>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-3 text-sm font-semibold text-cs-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_16px_32px_rgba(253,126,20,0.28)]"
              >
                Go to contact
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-cs-ink bg-cs-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-cs-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {year} Wanzami. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="/policy#terms" className="transition-colors duration-300 hover:text-cs-ink">
              Terms
            </Link>
            <Link href="/policy#privacy" className="transition-colors duration-300 hover:text-cs-ink">
              Privacy
            </Link>
            <Link href="/policy#faq" className="transition-colors duration-300 hover:text-cs-ink">
              FAQ
            </Link>
            <Link href="/contact" className="transition-colors duration-300 hover:text-cs-ink">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeUp {
              from {
                opacity: 0;
                transform: translate3d(0, 22px, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }

            .fade-up {
              opacity: 0;
              animation: fadeUp 0.8s ease-out forwards;
            }

            @media (prefers-reduced-motion: reduce) {
              .fade-up {
                opacity: 1;
                animation: none;
              }
            }
          `,
        }}
      />
    </main>
  );
}
