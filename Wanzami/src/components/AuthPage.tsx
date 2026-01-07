import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader } from './ui/loader';
import { TopLoader } from './TopLoader';
import orangeLogo from '../assets/logo.png';

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

  const handleApple = () => {
    toast.info('Apple sign-in is coming soon.');
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.AUTH_SERVICE_URL ||
        "https://api.carlylehub.org/api";
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <TopLoader active={loading || googleLoading} />
      <div className="flex items-center justify-center px-6 py-16 w-full">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-3 mb-8">
            <Image src={orangeLogo} alt="Wanzami" width={110} height={110} priority className="mx-auto" />
            <div className="text-center">
              <h1 className="text-white text-3xl font-semibold">Welcome back</h1>
              <p className="text-white/70 text-sm">Sign in to continue your streaming journey.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0d0d0f] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-1">Sign in</h2>
              <p className="text-white/70 text-sm">Enter your details below.</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleApple}
                className="w-full bg-white hover:bg-white/90 text-black py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full bg-white hover:bg-white/90 text-black py-3 rounded-lg transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
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
                <div className="w-full border-t border-white/15" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d0d0f] px-3 text-white/60 text-sm">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-white">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[#fd7e14] hover:text-[#e86f0f] text-sm">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] transition-colors pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="w-full bg-[#e25a00] hover:bg-[#fd7e14] text-white py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading && <Loader size={16} />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </motion.button>
            </form>

            <p className="text-white/60 text-center mt-6">
              Don&apos;t have an account?{' '}
              <button onClick={onShowSignup} className="text-[#fd7e14] hover:text-[#e86f0f] transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
