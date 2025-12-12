import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Logo } from './Logo';
import { Loader } from './ui/loader';
import { TopLoader } from './TopLoader';

interface AuthPageProps {
  onAuth: () => void;
  onShowSignup: () => void;
}

type Shape = {
  type: 'circle' | 'rounded' | 'square';
  color: string;
  size: string;
  x: number;
  y: number;
  duration?: number;
};

const geometricShapes: Shape[] = [
  { type: 'circle', color: 'bg-orange-500', size: 'w-64 h-64', x: 12, y: 60, duration: 18 },
  { type: 'rounded', color: 'bg-purple-500', size: 'w-64 h-64', x: 64, y: 24, duration: 20 },
  { type: 'circle', color: 'bg-teal-400', size: 'w-52 h-52', x: 42, y: 54, duration: 16 },
];

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
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col lg:flex-row">
      <TopLoader active={loading || googleLoading} />

      {/* Left gradient hero with soft floating shapes */}
      <div
        className="hidden lg:flex lg:w-1/2 lg:flex-none lg:shrink-0 lg:grow-0 min-h-screen relative overflow-hidden items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(255,123,57,0.65), transparent 42%), radial-gradient(circle at 72% 10%, rgba(194,71,255,0.55), transparent 48%), radial-gradient(circle at 58% 72%, rgba(0,194,168,0.55), transparent 50%), linear-gradient(135deg, #ff7b39, #c247ff 45%, #00c2a8)',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-[#ff7b39]/30 via-[#c247ff]/25 to-[#00c2a8]/25" />
        <div className="absolute inset-0" style={{ perspective: '1000px' }}>
          {geometricShapes.map((shape, index) => (
            <motion.div
              key={`${shape.type}-${index}`}
              className={`absolute ${shape.size}`}
              style={{ left: `${shape.x}%`, top: `${shape.y}%` }}
              initial={{ opacity: 0.75, scale: 1 }}
              animate={{
                x: [0, 30, 0],
                y: [0, -25, 0],
                scale: [1, 1.05, 1],
                opacity: [0.75, 0.9, 0.75],
              }}
              transition={{
                duration: shape.duration ?? 18,
                delay: index * 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                className={`w-full h-full ${shape.color} ${
                  shape.type === 'circle'
                    ? 'rounded-full'
                    : shape.type === 'rounded'
                    ? 'rounded-3xl rotate-45'
                    : 'rounded-lg'
                }`}
                style={{ boxShadow: '0 30px 90px rgba(0, 0, 0, 0.35)', filter: 'blur(1px)' }}
              />
              <div
                className={`absolute inset-0 ${shape.color} ${
                  shape.type === 'circle'
                    ? 'rounded-full'
                    : shape.type === 'rounded'
                    ? 'rounded-3xl rotate-45'
                    : 'rounded-lg'
                }`}
                style={{ filter: 'blur(30px)', opacity: 0.65, transform: 'scale(1.25)' }}
              />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Logo size="splash" />
            <h1 className="text-white text-5xl font-semibold mt-6 mb-4 drop-shadow-[0_5px_30px_rgba(0,0,0,0.4)]">
              Welcome Back
            </h1>
            <p className="text-white/80 text-xl max-w-md mx-auto">
              Continue your streaming journey with unlimited entertainment.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right column: centered dark card on black */}
      <div className="w-full lg:w-1/2 lg:flex-none lg:shrink-0 lg:grow-0 flex items-center justify-center px-6 py-16 bg-black min-h-screen">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/4 to-white/0 blur-lg" />
          <div className="relative rounded-3xl bg-[#0d0d0f] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <Logo size="large" />
              <span className="text-2xl">Wanzami</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-1">Sign in to your account</h2>
              <p className="text-white/70 text-sm">Welcome back! Please enter your details.</p>
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
