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
    <div className="min-h-[60vh] max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Contact Us</h1>
        <p className="mt-2 text-sm text-gray-300">
          Have an issue with playback, billing, or your account? Send us a message and our team will get back to you.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Subject</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Message</label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#fd7e14] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff9f4d] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

