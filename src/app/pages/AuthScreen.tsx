import { useState } from "react";
import { useNavigate } from "react-router";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { QrCode, Mail, Smartphone } from "lucide-react";

export function AuthScreen() {
  const navigate = useNavigate();
  const { isTv } = useDevice();
  const [email, setEmail] = useState("");
  const [activationCode] = useState("WANZ-7294");

  const handleAuth = () => {
    // Mock authentication
    navigate("/");
  };

  if (isTv) {
    return <TVAuthScreen activationCode={activationCode} onAuth={handleAuth} />;
  }

  return <TabletAuthScreen email={email} setEmail={setEmail} onAuth={handleAuth} />;
}

function TVAuthScreen({ activationCode, onAuth }: { activationCode: string; onAuth: () => void }) {
  return (
    <div className="h-screen w-screen bg-[#0A0A0F] flex items-center justify-center p-16">
      <div className="max-w-4xl w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center">
            <span className="text-white font-bold text-3xl">W</span>
          </div>
          <span className="text-white text-5xl font-bold tracking-tight">Wanzami</span>
        </div>

        {/* Auth Content */}
        <div className="bg-[#0F0F14] rounded-3xl p-16 border border-white/5">
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            Sign in to Wanzami
          </h1>
          <p className="text-xl text-white/60 text-center mb-12">
            Use your mobile device or computer to activate this TV
          </p>

          <div className="grid grid-cols-2 gap-12">
            {/* QR Code Method */}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 bg-white rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-56 h-56 text-[#0A0A0F]" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Scan QR Code</h3>
              <p className="text-lg text-white/60 text-center">
                Open Wanzami on your phone and scan this code
              </p>
            </div>

            {/* Activation Code Method */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-6">
                <Smartphone className="w-24 h-24 text-[#E63946] mx-auto mb-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Or enter this code</h3>
              <div className="bg-[#0A0A0F] border-2 border-[#E63946] rounded-2xl px-12 py-6 mb-6">
                <p className="text-5xl font-bold text-white tracking-wider text-center">
                  {activationCode}
                </p>
              </div>
              <p className="text-lg text-white/60 text-center mb-8">
                Visit <span className="text-[#E63946] font-semibold">wanzami.tv/activate</span>
              </p>

              {/* Demo: Skip to app */}
              <FocusableButton
                id="auth-skip"
                onClick={onAuth}
                autoFocus
                className="bg-[#E63946] hover:bg-[#D62839] text-white px-12 py-4 rounded-xl text-xl font-semibold"
              >
                Continue to App (Demo)
              </FocusableButton>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-center mt-8 text-lg">
          New to Wanzami? Sign up at wanzami.tv
        </p>
      </div>
    </div>
  );
}

function TabletAuthScreen({ 
  email, 
  setEmail, 
  onAuth 
}: { 
  email: string; 
  setEmail: (v: string) => void; 
  onAuth: () => void 
}) {
  const { isPortrait } = useDevice();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-8">
      <div className={`w-full ${isPortrait ? "max-w-md" : "max-w-lg"}`}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <span className="text-white text-3xl font-bold tracking-tight">Wanzami</span>
        </div>

        {/* Auth Form */}
        <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/5">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/60 mb-8">Sign in to continue watching</p>

          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E63946]"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E63946]"
              />
            </div>

            <button
              onClick={onAuth}
              className="w-full bg-[#E63946] hover:bg-[#D62839] text-white py-3.5 rounded-xl font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/40 text-sm">or continue with</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-[#0A0A0F] hover:bg-white/5 border border-white/10 text-white py-3 rounded-xl transition-colors">
              <Mail className="w-5 h-5" />
              <span>Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#0A0A0F] hover:bg-white/5 border border-white/10 text-white py-3 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <p className="text-white/40 text-center mt-6 text-sm">
            Don't have an account?{" "}
            <button className="text-[#E63946] hover:underline">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
