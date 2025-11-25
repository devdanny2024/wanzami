import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Logo } from './Logo';
import { Loader } from './ui/loader';

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
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
              <a href="/forgot-password" className="text-[#fd7e14] hover:text-[#e86f0f] text-sm transition-colors">
                Forgot Password?
              </a>
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
