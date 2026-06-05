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
        <div className="rounded-2xl sm:rounded-3xl bg-card border border-white/10 p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/40">
          <div>
            <p className="font-heading text-brand tracking-widest text-sm mb-2">We're here to help</p>
            <h1 className="font-heading text-foreground text-3xl sm:text-4xl tracking-wide leading-none">Contact Us</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
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
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 min-h-[44px] text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 min-h-[44px] text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-y transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-brand px-6 py-3 min-h-[44px] text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
