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
        <div className="mb-4 w-80 md:w-96 rounded-2xl bg-[#050608]/95 border border-white/10 shadow-2xl shadow-black/70 backdrop-blur-xl p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#fd7e14]" />
                <p className="text-sm font-medium">Need help?</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300">
            Send us a quick message and we&apos;ll follow up by email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
            />
            <textarea
              required
              rows={3}
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] resize-none"
            />
            {status && <p className="text-[11px] text-gray-300">{status}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#fd7e14] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ff9f4d] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#fd7e14] hover:bg-[#ff9f4d] flex items-center justify-center shadow-xl shadow-[#fd7e14]/50"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </button>
    </div>
  );
}
