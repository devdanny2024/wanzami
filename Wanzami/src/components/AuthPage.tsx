import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Logo } from './Logo';
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
        body: JSON.stringify(formData)
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
      const redirectUri = `${window.location.origin}/oauth/google/callback`;
      const res = await fetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`);
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <TopLoader active={loading || googleLoading} />
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fd7e14]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fd7e14]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <Logo size="large" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 tracking-[0.2em] text-sm"
          >
            Watch What Matters
          </motion.p>
        </div>

        {/* Form container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-gray-800"
        >
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 py-3 rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="w-5 h-5" aria-hidden>
                <svg viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.44 0 5.8 1.49 7.13 2.74l5.2-5.08C32.9 3.6 28.86 2 24 2 14.84 2 7.17 7.8 4.3 15.3l6.8 5.28C12.66 14.6 17.77 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.59-.14-3.17-.42-4.7H24v9.02h12.7c-.55 3-2.22 5.54-4.73 7.24l7.38 5.72C43.85 37.73 46.5 31.6 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M11.1 28.42c-.52-1.53-.82-3.16-.82-4.92s.3-3.4.82-4.92l-6.8-5.28C2.83 15.36 2 19.09 2 23.5s.83 8.14 2.3 10.2l6.8-5.28z"/>
                  <path fill="#34A853" d="M24 46c5.4 0 9.93-1.78 13.24-4.85l-7.38-5.72c-2.05 1.38-4.68 2.2-7.86 2.2-6.23 0-11.34-5.1-12.9-11.78l-6.8 5.28C7.17 40.2 14.84 46 24 46z"/>
                </svg>
              </span>
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <span className="flex-1 h-px bg-gray-800" />
              <span>or</span>
              <span className="flex-1 h-px bg-gray-800" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-2xl font-semibold">Login</h2>
            <p className="text-gray-400 text-sm mt-1">
              Welcome back. Sign in to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fd7e14] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fd7e14] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-[#fd7e14] hover:text-[#e86f0f] text-sm transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              <input
                id="remember"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-[#fd7e14] hover:bg-[#e86f0f] text-white py-3 rounded-xl transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader size={16} />}
                {loading ? 'Signing in...' : 'Login'}
              </span>
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <span className="mr-1">Don't have an account?</span>
            <button
              type="button"
              onClick={onShowSignup}
              className="text-[#fd7e14] hover:text-[#e86f0f] font-semibold"
            >
              Sign up
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
