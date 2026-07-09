'use client';

import { FormEvent, useState } from 'react';

type TicketResponse = {
  ticket?: {
    id: string;
  };
  message?: string;
};

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });
      const data = (await res.json().catch(() => ({}))) as TicketResponse;
      if (!res.ok) {
        throw new Error(data.message ?? 'Failed to submit ticket');
      }
      setSuccess('Thanks, your message has been received.');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] container-page py-10 sm:py-14 home-root">
      <div className="max-w-2xl mx-auto">
        <div className="bg-cs-panel cs-border cs-shadow-lg p-6 sm:p-8 md:p-10">
          <div>
            <p className="cs-slug mb-2">We're here to help</p>
            <h1 className="font-heading text-cs-ink text-3xl sm:text-4xl tracking-wide leading-none uppercase">Contact Us</h1>
            <p className="mt-3 text-sm sm:text-base text-cs-muted leading-relaxed">
              Have an issue with playback, billing, or your account? Send us a message and our team will get back to you.
            </p>
          </div>

          {success && (
            <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cs-paper cs-border-thin px-4 py-3 min-h-[44px] text-sm text-cs-ink outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-cs-paper cs-border-thin px-4 py-3 min-h-[44px] text-sm text-cs-ink outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-cs-paper cs-border-thin px-4 py-3 text-sm text-cs-ink outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust resize-y transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full sm:w-auto items-center justify-center bg-cs-rust px-6 py-3 min-h-[44px] font-mono text-sm font-bold uppercase tracking-[0.07em] text-cs-paper cs-shadow-sm hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
