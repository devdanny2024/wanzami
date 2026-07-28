'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CsButton, CsSlug, CsStamp } from '../../../src/components/cs/kit';
import { Loader } from '../../../src/components/ui/loader';

/* Accept invitation — Call Sheet styling. Everything here is inline styles or
   the real .cs-* classes from globals.css: the Admin app ships a frozen
   pre-compiled Tailwind export, so unlisted utility classes are dead. */

type InviteState =
  | { status: 'loading' }
  | {
      status: 'valid';
      email: string;
      role: string;
      roleLabel: string;
      expiresAt: string;
      invitedByName: string | null;
      invitedByEmail: string | null;
    }
  | { status: 'blocked'; code: string; message: string };

const PASSWORD_RULES = [
  { label: '8 characters or more', test: (v: string) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'A number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--cs-paper)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
};

const fieldStyle: React.CSSProperties = {
  border: '2.5px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 13,
  padding: '12px 14px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: 'var(--cs-ink)',
};

const errorTextStyle: React.CSSProperties = {
  marginTop: 6,
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--cs-rust)',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  justifyContent: 'space-between',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 11,
  color: 'var(--cs-muted)',
  padding: '8px 0',
  borderBottom: '1.5px solid var(--cs-line)',
};

function Sprockets() {
  return (
    <div
      style={{
        background: 'var(--cs-ink)',
        padding: '9px 14px',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} style={{ width: 8, height: 11, background: '#f2ead9' }} />
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div className="cs-border cs-shadow" style={{ background: 'var(--cs-paper)' }}>
          <Sprockets />
          <div style={{ padding: '26px 28px 28px 28px' }}>{children}</div>
          <Sprockets />
        </div>
        <p
          className="cs-mono"
          style={{ marginTop: 14, fontSize: 10, color: 'var(--cs-muted)', textAlign: 'center' }}
        >
          Wanzami admin · staff only · do not share this link
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AcceptInviteContent() {
  const search = useSearchParams();
  const token = search.get('token') ?? '';

  const [invite, setInvite] = useState<InviteState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadInvite = useCallback(async () => {
    if (!token) {
      setInvite({
        status: 'blocked',
        code: 'INVALID',
        message:
          'This link is missing its invitation token. Ask whoever invited you to send it again.',
      });
      return;
    }
    setInvite({ status: 'loading' });
    try {
      const res = await fetch(
        `/api/admin/invitations/lookup?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (!res.ok) {
        setInvite({
          status: 'blocked',
          code: data.code ?? 'INVALID',
          message: data.message ?? 'This invitation could not be loaded.',
        });
        return;
      }
      setInvite({
        status: 'valid',
        email: data.email,
        role: data.role,
        roleLabel: data.roleLabel ?? String(data.role ?? '').replace(/_/g, ' '),
        expiresAt: data.expiresAt,
        invitedByName: data.invitedByName ?? null,
        invitedByEmail: data.invitedByEmail ?? null,
      });
    } catch {
      setInvite({
        status: 'blocked',
        code: 'NETWORK',
        message:
          'We could not reach the Wanzami server. Check your connection and try again.',
      });
    }
  }, [token]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  const nameError = useMemo(() => {
    if (!touched) return '';
    if (name.trim().length < 2) return 'Enter your full name (2 characters or more).';
    return '';
  }, [name, touched]);

  const failedRules = useMemo(
    () => PASSWORD_RULES.filter((rule) => !rule.test(password)),
    [password],
  );

  const passwordError = useMemo(() => {
    if (!touched) return '';
    if (!password) return 'Choose a password.';
    if (failedRules.length > 0) return 'This password does not meet every rule below.';
    return '';
  }, [failedRules.length, password, touched]);

  const confirmError = useMemo(() => {
    if (!touched) return '';
    if (!confirm) return 'Type the password again.';
    if (confirm !== password) return 'The two passwords do not match.';
    return '';
  }, [confirm, password, touched]);

  const formValid =
    name.trim().length >= 2 && failedRules.length === 0 && confirm === password && !!password;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setSubmitError('');
    if (!formValid || invite.status !== 'valid') return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.message ?? 'This invitation could not be accepted.';
        // A dead invite is not a form error — swap the whole screen for the
        // honest explanation instead of leaving a form the user cannot submit.
        if (['INVALID', 'EXPIRED', 'ALREADY_ACCEPTED', 'EMAIL_MISMATCH'].includes(data.code)) {
          setInvite({ status: 'blocked', code: data.code, message });
        } else {
          setSubmitError(message);
        }
        toast.error(message);
        setSubmitting(false);
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('deviceId', data.deviceId);
      toast.success('Welcome to the crew');
      // Hard replace, not a router push: it drops the token-bearing URL out of
      // history and remounts the admin shell so it re-reads the new session.
      window.location.replace('/#dashboard');
    } catch {
      const message = 'We could not reach the Wanzami server. Try again in a moment.';
      setSubmitError(message);
      toast.error(message);
      setSubmitting(false);
    }
  };

  if (invite.status === 'loading') {
    return (
      <Shell>
        <CsSlug>Form W-04 · Crew onboarding</CsSlug>
        <h1 className="cs-display" style={{ fontSize: 40, color: 'var(--cs-ink)', marginTop: 6 }}>
          Checking your invite
        </h1>
        <div style={{ marginTop: 20 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 44,
                marginBottom: 10,
                background: 'var(--cs-panel)',
                border: '1.5px solid var(--cs-line)',
              }}
            />
          ))}
        </div>
        <p className="cs-mono" style={{ marginTop: 14, fontSize: 11, color: 'var(--cs-muted)' }}>
          One moment — reading the call sheet.
        </p>
      </Shell>
    );
  }

  if (invite.status === 'blocked') {
    const alreadyAccepted = invite.code === 'ALREADY_ACCEPTED';
    return (
      <Shell>
        <CsSlug>Form W-04 · Crew onboarding</CsSlug>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <h1 className="cs-display" style={{ fontSize: 40, color: 'var(--cs-ink)' }}>
            {alreadyAccepted ? 'Already signed in once' : 'This invite is closed'}
          </h1>
          <CsStamp>{alreadyAccepted ? 'Used' : invite.code}</CsStamp>
        </div>
        <p
          style={{
            marginTop: 16,
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--cs-ink)',
          }}
        >
          {invite.message}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
          <CsButton variant="rust" onClick={() => window.location.assign('/')}>
            {alreadyAccepted ? 'Go to login' : 'Go to Wanzami admin'}
          </CsButton>
          {invite.code === 'NETWORK' ? (
            <CsButton variant="outline" onClick={() => void loadInvite()}>
              Try again
            </CsButton>
          ) : null}
        </div>
        <p className="cs-mono" style={{ marginTop: 20, fontSize: 11, color: 'var(--cs-muted)' }}>
          Need a fresh invite? Ask a Wanzami super admin to send one from Team &amp; permissions.
        </p>
      </Shell>
    );
  }

  const inviter = invite.invitedByName || invite.invitedByEmail || 'A Wanzami super admin';
  const expiry = formatDate(invite.expiresAt);

  return (
    <Shell>
      <CsSlug>Form W-04 · Crew onboarding</CsSlug>
      <h1 className="cs-display" style={{ fontSize: 44, color: 'var(--cs-ink)', marginTop: 6 }}>
        Join the crew
      </h1>
      <p className="cs-mono" style={{ marginTop: 8, fontSize: 12, color: 'var(--cs-muted)' }}>
        {inviter} invited you to the Wanzami admin dashboard.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: '14px 16px',
          background: 'var(--cs-panel)',
          border: '2.5px solid var(--cs-ink)',
        }}
      >
        <CsSlug>Your booking</CsSlug>
        <p
          className="cs-display"
          style={{ fontSize: 26, color: 'var(--cs-ink)', marginTop: 6 }}
        >
          {invite.roleLabel}
        </p>
        <div style={{ marginTop: 10 }}>
          <div style={metaRowStyle}>
            <span>Account</span>
            <span style={{ color: 'var(--cs-ink)', fontWeight: 700 }}>{invite.email}</span>
          </div>
          <div style={{ ...metaRowStyle, borderBottom: 'none' }}>
            <span>Invite expires</span>
            <span style={{ color: 'var(--cs-ink)', fontWeight: 700 }}>
              {expiry ?? 'soon'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="invite-name" style={labelStyle}>
            Full name
          </label>
          <input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            autoComplete="name"
            placeholder="Ada Obi"
            aria-invalid={!!nameError}
            style={{
              ...fieldStyle,
              borderColor: nameError ? 'var(--cs-rust)' : 'var(--cs-ink)',
            }}
          />
          {nameError ? <p style={errorTextStyle}>{nameError}</p> : null}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="invite-password" style={labelStyle}>
            Password
          </label>
          <input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Pick something only you know"
            aria-invalid={!!passwordError}
            style={{
              ...fieldStyle,
              borderColor: passwordError ? 'var(--cs-rust)' : 'var(--cs-ink)',
            }}
          />
          {passwordError ? <p style={errorTextStyle}>{passwordError}</p> : null}
          <ul style={{ listStyle: 'none', margin: '10px 0 0 0', padding: 0 }}>
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className="cs-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: ok ? 'var(--cs-ink)' : 'var(--cs-muted)',
                    padding: '2px 0',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      color: ok ? 'var(--cs-brand)' : 'var(--cs-muted)',
                      fontWeight: 700,
                    }}
                  >
                    {ok ? '✓' : '·'}
                  </span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="invite-confirm" style={labelStyle}>
            Confirm password
          </label>
          <input
            id="invite-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Type it again"
            aria-invalid={!!confirmError}
            style={{
              ...fieldStyle,
              borderColor: confirmError ? 'var(--cs-rust)' : 'var(--cs-ink)',
            }}
          />
          {confirmError ? <p style={errorTextStyle}>{confirmError}</p> : null}
        </div>

        <CsButton type="submit" variant="rust" disabled={submitting} className="w-full">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting ? <Loader size={14} /> : null}
            {submitting ? 'Signing you in…' : 'Accept and set up my account'}
          </span>
        </CsButton>

        {submitError ? (
          <p style={{ ...errorTextStyle, marginTop: 12, fontSize: 12 }}>{submitError}</p>
        ) : null}
      </form>

      <p className="cs-mono" style={{ marginTop: 18, fontSize: 10, color: 'var(--cs-muted)' }}>
        Accepting creates your admin account for {invite.email} and takes you straight to the
        dashboard.
      </p>
    </Shell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <CsSlug>Form W-04 · Crew onboarding</CsSlug>
          <h1 className="cs-display" style={{ fontSize: 40, color: 'var(--cs-ink)', marginTop: 6 }}>
            Loading
          </h1>
        </Shell>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
