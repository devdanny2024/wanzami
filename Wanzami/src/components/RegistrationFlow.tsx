import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Film, Heart, Zap, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Loader } from './ui/loader';

interface RegistrationFlowProps {
  onAuth: (data: { email: string; name: string }) => void;
  onBack?: () => void;
  onLogin?: () => void;
}

const genres = [
  { id: 'action', label: 'Action', icon: Zap },
  { id: 'romance', label: 'Romance', icon: Heart },
  { id: 'thriller', label: 'Thriller', icon: Film },
  { id: 'nollywood', label: 'Nollywood Classics', icon: Sparkles },
  { id: 'documentary', label: 'Documentaries', icon: Globe },
  { id: 'comedy', label: 'Comedy', icon: Sparkles },
  { id: 'drama', label: 'Drama', icon: Film },
  { id: 'horror', label: 'Horror', icon: Zap }
];

export function RegistrationFlow({ onAuth, onBack, onLogin }: RegistrationFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Unable to register. Please try again.');
        toast.error(data.message ?? 'Unable to register. Please try again.');
        return;
      }
      toast.success('Account created. Check your email to verify.');
      onAuth({ email: formData.email, name: formData.name });
    } catch (err) {
      setError('Unable to register. Please try again.');
      toast.error('Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0b0c] overflow-hidden">
      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fd7e14]/10 via-transparent to-[#fd7e14]/5" />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900">
        <motion.div
          className="h-full bg-gradient-to-r from-[#fd7e14] to-[#ff9f4d]"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="relative h-full flex items-center justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onBack?.()}
              className="text-gray-300 hover:text-white text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => onLogin?.()}
              className="text-sm text-[#fd7e14] hover:text-[#ff9f4d] font-semibold"
            >
              Already have an account? Login
            </button>
          </div>
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#fd7e14] to-[#ff9f4d] rounded-2xl mb-6 shadow-2xl shadow-[#fd7e14]/20"
                  >
                    <Film className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-white text-4xl md:text-5xl mb-4 tracking-tight">
                    Welcome to Wanzami
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Let's customize your movie experience
                  </p>
                </div>

                {/* Form */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl space-y-6">
                  {/* Name Field */}
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder=" "
                      className="peer w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#fd7e14] transition-all"
                    />
                    <label className="absolute left-4 -top-3 bg-[#0b0b0c] px-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#fd7e14]">
                      Full Name
                    </label>
                  </div>

                  {/* Email Field */}
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder=" "
                      className="peer w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#fd7e14] transition-all"
                    />
                    <label className="absolute left-4 -top-3 bg-[#0b0b0c] px-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#fd7e14]">
                      Email Address
                    </label>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder=" "
                      className="peer w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#fd7e14] transition-all"
                    />
                    <label className="absolute left-4 -top-3 bg-[#0b0b0c] px-2 text-sm text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#fd7e14]">
                      Password
                    </label>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-[#fd7e14] to-[#ff9f4d] text-white rounded-2xl hover:shadow-2xl hover:shadow-[#fd7e14]/30 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <span className="tracking-wide">Continue</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center mb-12">
                  <h1 className="text-white text-4xl md:text-5xl mb-4 tracking-tight">
                    What do you love?
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Select your favorite genres (pick at least 3)
                  </p>
                </div>

                {/* Genre Pills */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {genres.map((genre, index) => {
                      const Icon = genre.icon;
                      const isSelected = selectedGenres.includes(genre.id);
                      
                      return (
                        <motion.button
                          key={genre.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleGenreToggle(genre.id)}
                          className={`relative px-6 py-4 rounded-2xl border-2 transition-all duration-300 group ${
                            isSelected
                              ? 'bg-[#fd7e14]/20 border-[#fd7e14] shadow-lg shadow-[#fd7e14]/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-[#fd7e14]' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                            <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                              {genre.label}
                            </span>
                          </div>
                          
                          {/* Checkmark */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[#fd7e14] rounded-full flex items-center justify-center shadow-lg"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-4 bg-white/5 text-white rounded-2xl border border-white/20 hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={selectedGenres.length < 3}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-[#fd7e14] to-[#ff9f4d] text-white rounded-2xl hover:shadow-2xl hover:shadow-[#fd7e14]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      <span className="tracking-wide">Continue</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#fd7e14] to-[#ff9f4d] rounded-full mb-6 shadow-2xl shadow-[#fd7e14]/30"
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-white text-4xl md:text-5xl mb-4 tracking-tight">
                    Ready to begin your journey?
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Here's what we've set up for you
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Name</div>
                      <div className="text-white text-lg">{formData.name || 'Movie Lover'}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Email</div>
                      <div className="text-white text-lg">{formData.email || 'your@email.com'}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Your Preferences</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedGenres.map(genreId => {
                          const genre = genres.find(g => g.id === genreId);
                          return (
                            <span
                              key={genreId}
                              className="px-4 py-2 bg-[#fd7e14]/20 border border-[#fd7e14] text-[#fd7e14] rounded-full text-sm"
                            >
                              {genre?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-4 bg-white/5 text-white rounded-2xl border border-white/20 hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-[#fd7e14] to-[#ff9f4d] text-white rounded-2xl hover:shadow-2xl hover:shadow-[#fd7e14]/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="tracking-wide flex items-center gap-2">
                        {loading && <Loader size={16} />}
                        {loading ? 'Creating account...' : 'Create account'}
                      </span>
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
