import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wanzami Policies',
  description: 'Terms of use, privacy policy, and frequently asked questions for Wanzami.',
};

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
];

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 md:px-8 lg:px-10">
        <div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[#fd7e14]/30 bg-[#fd7e14]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[#fd7e14]">
              Wanzami Policies
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Terms, privacy, and FAQ</h1>
              <p className="max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
                Clear, simple information about how Wanzami works, how we protect your privacy, and what you can expect from the platform.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/policy#terms"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:border-[#fd7e14] hover:text-white"
            >
              Terms of Use
            </Link>
            <Link
              href="/policy#privacy"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:border-[#fd7e14] hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/policy#faq"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-gray-200 transition hover:border-[#fd7e14] hover:text-white"
            >
              FAQ
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          <section id="terms" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#fd7e14]">Terms of Use</p>
            <p className="text-sm leading-7 text-gray-200 md:text-base">
              By using Wanzami, you agree to access content for personal, non-commercial use only. Creators retain full rights to their content. Any unauthorized copying, sharing, or distribution is prohibited. We reserve the right to suspend accounts that violate these terms.
            </p>
          </section>

          <section id="privacy" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#fd7e14]">Privacy Policy</p>
            <p className="text-sm leading-7 text-gray-200 md:text-base">
              We respect your privacy. Wanzami only collects necessary data to improve user experience and ensure secure payments. We do not sell or share your information with third parties without your consent.
            </p>
          </section>

          <section id="faq" className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#fd7e14]">FAQ</p>
              <h2 className="text-2xl font-semibold md:text-3xl">Frequently asked questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((item, index) => (
                <div key={item.question} className="rounded-2xl border border-white/8 bg-black/30 p-5">
                  <p className="mb-2 text-base font-medium text-white">
                    {index + 1}. {item.question}
                  </p>
                  <p className="text-sm leading-7 text-gray-300 md:text-base">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-400 md:flex-row md:items-center">
          <p>© 2026 Wanzami. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/policy#terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/policy#privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/policy#faq" className="transition hover:text-white">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
