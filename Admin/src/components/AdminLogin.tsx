import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { Loader } from './ui/loader';

interface AdminLoginProps {
  onLogin: () => void;
}

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
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Left side - Blurred movie stills */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950 z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1645610755540-03398a1e5016?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY2luZW1hdGljJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjM5MTc4Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Cinematic background"
          className="w-full h-full object-cover blur-sm scale-110"
        />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#fd7e14] mb-6">
              <span className="text-2xl text-white">W</span>
            </div>
            <h1 className="text-3xl text-white">Wanzami Admin</h1>
            <p className="mt-2 text-neutral-400">Admin Access Only</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-neutral-300">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-[#fd7e14] focus:ring-[#fd7e14]"
                  placeholder="admin@wanzami.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-neutral-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-[#fd7e14] focus:ring-[#fd7e14]"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-[#fd7e14] focus:ring-[#fd7e14]"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-neutral-400">
                  Remember me
                </label>
              </div>

              <button type="button" className="text-sm text-[#fd7e14] hover:text-[#ff9940] transition-colors">
                Forgot password?
              </button>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#fd7e14] hover:bg-[#ff9940] text-white transition-all disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading && <Loader size={16} />}
                  {loading ? 'Logging in...' : 'Log In'}
                </span>
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          </form>

          <p className="text-center text-xs text-neutral-500 mt-8">
            Secure admin portal for Wanzami platform management
          </p>
        </div>
      </div>
    </div>
  );
}
