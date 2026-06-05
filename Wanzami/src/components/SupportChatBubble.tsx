'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

type TicketResponse = {
  ticket?: { id: string };
  message?: string;
};

export function SupportChatBubble() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject: 'In-app support',
          message,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as TicketResponse;
      if (!res.ok) {
        throw new Error(data.message ?? 'Failed to send message');
      }
      setStatus('Sent! Our team will email you shortly.');
      setMessage('');
    } catch (err: any) {
      setStatus(err?.message ?? 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 md:bottom-6 md:right-6 z-40">
      {open && (
        <div className="mb-4 w-[calc(100vw-1.5rem)] max-w-sm md:w-96 rounded-2xl bg-card/95 border border-white/10 shadow-2xl shadow-black/70 backdrop-blur-xl p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-brand" />
                <p className="font-heading text-base tracking-wide text-foreground">Need help?</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Send us a quick message and we&apos;ll follow up by email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <textarea
              required
              rows={3}
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
            />
            {status && <p className="text-[11px] text-muted-foreground">{status}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand px-3 py-2.5 min-h-[40px] text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand hover:bg-brand-light flex items-center justify-center shadow-xl shadow-brand/50"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </button>
    </div>
  );
}
