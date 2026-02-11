import { motion } from "motion/react";
import logo from "figma:asset/e72a81e634e1779c94b87c6dbc66663c53e48253.png";

interface RegisterScreenProps {
  onRegister: () => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFB020]/10 via-[#0B0B0F] to-[#0B0B0F]" />
      
      <div className="relative flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <img src={logo} alt="WANZAMI" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-[#A1A1AA]">Join the WANZAMI community</p>
        </motion.div>

        {/* Social login buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          {/* Google signup */}
          <button
            onClick={onRegister}
            className="w-full bg-white hover:bg-gray-100 text-[#0B0B0F] py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            <span className="font-semibold">Sign up with Google</span>
          </button>

          {/* Apple signup */}
          <button
            onClick={onRegister}
            className="w-full bg-white hover:bg-gray-100 text-[#0B0B0F] py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="font-semibold">Sign up with Apple</span>
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="flex-1 h-px bg-[#1C1C25]" />
          <span className="text-[#A1A1AA] text-sm">OR</span>
          <div className="flex-1 h-px bg-[#1C1C25]" />
        </motion.div>

        {/* Registration form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-6"
        >
          <div>
            <label className="text-white text-sm mb-2 block">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full bg-[#14141B] border border-[#1C1C25] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-[#14141B] border border-[#1C1C25] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>
          
          <div>
            <label className="text-white text-sm mb-2 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[#14141B] border border-[#1C1C25] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>

          <button
            onClick={onRegister}
            className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white py-4 rounded-xl font-semibold transition-colors"
          >
            Create Account
          </button>

          <p className="text-[#6B7280] text-xs text-center">
            By signing up, you agree to our{" "}
            <button className="text-[#FF6A00] hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button className="text-[#FF6A00] hover:underline">Privacy Policy</button>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-[#A1A1AA] text-sm">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-[#FF6A00] font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
