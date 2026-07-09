import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader } from './ui/loader';
import { TopLoader } from './TopLoader';

interface AuthPageProps {
  onAuth: () => void;
  onShowSignup: () => void;
}

export function AuthPage({ onAuth, onShowSignup }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message ?? 'Login failed';
        setError(msg);
        toast.error(msg);
        if (res.status === 403 && msg.toLowerCase().includes('email not verified')) {
          window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`;
        }
        return;
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('deviceId', data.deviceId);
      toast.success('Logged in');
      onAuth();
    } catch (err) {
      setError('Unable to login. Please try again.');
      toast.error('Unable to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.AUTH_SERVICE_URL ||
        "https://api.blvckcode.io/api";
      const redirectUri = `${window.location.origin}/oauth/google/callback`;
      const res = await fetch(
        `${apiBase.replace(/\/+$/, "")}/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`
      );
      const data = await res.json();
      if (!res.ok || !data?.url) {
        const msg = data?.message ?? 'Google sign-in unavailable right now.';
        setError(msg);
        toast.error(msg);
        setGoogleLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch (err) {
      setError('Unable to start Google sign-in. Please try again.');
      toast.error('Unable to start Google sign-in. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root relative overflow-hidden auth-root">
      <TopLoader active={loading || googleLoading} />
      <div className="flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16 w-full auth-shell">
        <div className="w-full max-w-md auth-card">
          <div className="flex flex-col items-center gap-3 mb-8 auth-header">
            <span className="font-heading text-5xl tracking-wide text-cs-ink leading-none">WANZAMI</span>
            <div className="text-center">
              <p className="cs-slug mb-2">Crew sign-in — call sheet access</p>
              <h1 className="font-heading text-4xl sm:text-5xl tracking-wide text-cs-ink leading-none uppercase">Welcome Back</h1>
              <p className="text-cs-muted text-sm mt-1">Sign in to continue your streaming journey.</p>
            </div>
          </div>

          <div className="bg-cs-panel cs-border cs-shadow p-6 sm:p-8 auth-panel">
            <div className="mb-6">
              <h2 className="font-heading text-2xl sm:text-3xl tracking-wide mb-1 uppercase text-cs-ink">Sign in</h2>
              <p className="text-cs-muted text-sm">Enter your details below.</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full bg-cs-paper cs-border-thin text-cs-ink py-3 font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors hover:bg-cs-paper/70 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cs-line" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-cs-panel px-3 text-cs-muted font-mono text-[11px] uppercase tracking-[0.08em]">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-cs-paper cs-border-thin px-4 py-3 text-cs-ink placeholder:text-cs-muted focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-cs-rust hover:text-cs-ink text-sm font-mono uppercase tracking-[0.04em]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-cs-paper cs-border-thin px-4 py-3 text-cs-ink placeholder:text-cs-muted focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cs-muted hover:text-cs-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-cs-rust text-sm font-mono">{error}</p>}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading && <Loader size={16} />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </motion.button>
            </form>

            <p className="text-cs-muted text-center mt-6 text-sm">
              Don&apos;t have an account?{' '}
              <button onClick={onShowSignup} className="text-cs-rust hover:text-cs-ink transition-colors font-semibold">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
