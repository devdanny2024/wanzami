import { useState } from 'react';
import { toast } from 'sonner';
import { Loader } from './ui/loader';
import { CsButton, CsSlug, CsStamp } from './cs/kit';

interface AdminLoginProps {
  onLogin: () => void;
}

const fieldStyle: React.CSSProperties = {
  border: '2.5px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 13,
  padding: '12px 14px',
  width: '100%',
};

const sprockets = Array.from({ length: 14 });

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Login failed');
        toast.error(data.message ?? 'Login failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('deviceId', data.deviceId);
      toast.success('Welcome back');
      onLogin();
    } catch (err) {
      setError('Unable to login. Please try again.');
      toast.error('Unable to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cs-paper)' }}>
      {/* Left — the reel: dark call-sheet slate, mirrors the mobile splash */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10"
        style={{ background: 'var(--cs-ink)' }}
      >
        <div className="flex justify-between px-1">
          {sprockets.map((_, i) => (
            <span key={i} className="w-2 h-3 rounded-sm" style={{ background: '#3a342c' }} />
          ))}
        </div>

        <div>
          <p className="cs-mono font-bold uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.09em', color: '#8a8578' }}>
            Wanzami TV presents
          </p>
          <h1 className="cs-display" style={{ fontSize: 96, color: 'var(--cs-paper)' }}>
            WANZAMI
          </h1>
          <div className="mt-5 flex items-center gap-3">
            <span
              className="cs-mono font-bold uppercase"
              style={{ fontSize: 10, letterSpacing: '0.1em', color: '#8a8578' }}
            >
              PROD. Admin office · SCENE 01 · TAKE 01
            </span>
          </div>
          <p className="mt-8 max-w-sm text-sm" style={{ color: '#c9c4b8', lineHeight: 1.6 }}>
            The production office. Movies, tickets, viewers, revenue — the whole slate, one room.
          </p>
        </div>

        <div className="flex justify-between px-1">
          {sprockets.map((_, i) => (
            <span key={i} className="w-2 h-3 rounded-sm" style={{ background: '#3a342c' }} />
          ))}
        </div>
      </div>

      {/* Right — the sign-in sheet */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          <CsSlug className="mb-1">Form W-03 · Crew sign-in</CsSlug>
          <h2 className="cs-display" style={{ fontSize: 44, color: 'var(--cs-ink)' }}>
            ADMIN OFFICE
          </h2>
          <p className="cs-mono text-xs mt-2" style={{ color: 'var(--cs-muted)' }}>
            Access restricted to Wanzami production staff.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="cs-mono block mb-1.5 text-[10px] font-bold uppercase"
                style={{ letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={fieldStyle}
                placeholder="admin@wanzami.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="cs-mono block mb-1.5 text-[10px] font-bold uppercase"
                style={{ letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={fieldStyle}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--cs-ink)' }}
                />
                <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)', letterSpacing: '0.06em' }}>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="cs-mono text-xs font-bold uppercase transition-colors"
                style={{ color: 'var(--cs-rust)', letterSpacing: '0.06em' }}
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-2 space-y-3">
              <CsButton type="submit" variant="rust" disabled={loading} className="w-full flex items-center justify-center">
                <span className="flex items-center justify-center gap-2">
                  {loading && <Loader size={14} />}
                  {loading ? 'Rolling…' : 'Log in'}
                </span>
              </CsButton>
              {error && (
                <p className="cs-mono text-xs font-bold" style={{ color: 'var(--cs-rust)' }}>
                  {error}
                </p>
              )}
            </div>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <p className="cs-mono text-[10px]" style={{ color: 'var(--cs-muted)' }}>
              Secure admin portal · Wanzami platform management
            </p>
            <CsStamp>Staff only</CsStamp>
          </div>
        </div>
      </div>
    </div>
  );
}
