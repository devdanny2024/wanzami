import { useState } from "react";
import { User, CreditCard, Calendar, CheckCircle } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";

export function Profile() {
  const { isTv, isPortrait } = useDevice();
  const [activeTab, setActiveTab] = useState<"account" | "subscription">("account");

  return (
    <div className={`min-h-screen ${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
      <h1 className={`text-white font-bold mb-8 ${isTv ? "text-6xl" : "text-4xl"}`}>
        Profile
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-12">
        <button
          onClick={() => setActiveTab("account")}
          className={`
            px-8 py-4 rounded-xl font-semibold transition-all
            ${isTv ? "text-2xl" : "text-lg"}
            ${activeTab === "account" 
              ? "bg-[#E63946] text-white" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Account
        </button>
        <button
          onClick={() => setActiveTab("subscription")}
          className={`
            px-8 py-4 rounded-xl font-semibold transition-all
            ${isTv ? "text-2xl" : "text-lg"}
            ${activeTab === "subscription" 
              ? "bg-[#E63946] text-white" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          Subscription & Billing
        </button>
      </div>

      {activeTab === "account" ? <AccountTab /> : <SubscriptionTab />}
    </div>
  );
}

function AccountTab() {
  const { isTv, isPortrait } = useDevice();

  return (
    <div className={`max-w-4xl space-y-8`}>
      {/* Profile Card */}
      <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
        <div className="flex items-center gap-6 mb-8">
          <div className={`${isTv ? "w-28 h-28" : "w-20 h-20"} rounded-full bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center`}>
            <User className={`${isTv ? "w-14 h-14" : "w-10 h-10"} text-white`} />
          </div>
          <div>
            <h2 className={`text-white font-bold mb-1 ${isTv ? "text-4xl" : "text-2xl"}`}>
              Kwame Mensah
            </h2>
            <p className={`text-white/60 ${isTv ? "text-xl" : "text-base"}`}>
              kwame.mensah@email.com
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Kwame Mensah"
              className={`
                w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3
                text-white focus:outline-none focus:border-[#E63946]
                ${isTv ? "text-xl" : "text-base"}
              `}
            />
          </div>

          <div>
            <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
              Email
            </label>
            <input
              type="email"
              defaultValue="kwame.mensah@email.com"
              className={`
                w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3
                text-white focus:outline-none focus:border-[#E63946]
                ${isTv ? "text-xl" : "text-base"}
              `}
            />
          </div>

          <div>
            <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
              Phone
            </label>
            <input
              type="tel"
              defaultValue="+233 24 123 4567"
              className={`
                w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3
                text-white focus:outline-none focus:border-[#E63946]
                ${isTv ? "text-xl" : "text-base"}
              `}
            />
          </div>

          <div>
            <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
              Country
            </label>
            <select
              defaultValue="Ghana"
              className={`
                w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3
                text-white focus:outline-none focus:border-[#E63946]
                ${isTv ? "text-xl" : "text-base"}
              `}
            >
              <option>Ghana</option>
              <option>Nigeria</option>
              <option>Kenya</option>
              <option>South Africa</option>
              <option>Tanzania</option>
            </select>
          </div>
        </div>

        <FocusableButton
          id="profile-save"
          onClick={() => {}}
          autoFocus
          className={`
            mt-8 bg-[#E63946] hover:bg-[#D62839] text-white rounded-xl
            font-semibold transition-colors
            ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
          `}
        >
          Save Changes
        </FocusableButton>
      </div>

      {/* Viewing Preferences */}
      <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
        <h3 className={`text-white font-semibold mb-6 ${isTv ? "text-3xl" : "text-xl"}`}>
          Viewing Preferences
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-white ${isTv ? "text-xl" : "text-base"}`}>
              Autoplay next episode
            </span>
            <label className="relative inline-block w-14 h-8">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-14 h-8 bg-white/10 peer-checked:bg-[#E63946] rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-white ${isTv ? "text-xl" : "text-base"}`}>
              Autoplay previews
            </span>
            <label className="relative inline-block w-14 h-8">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-14 h-8 bg-white/10 peer-checked:bg-[#E63946] rounded-full peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab() {
  const { isTv, isPortrait } = useDevice();
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "flutterwave">("paystack");

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "₦2,500",
      period: "/month",
      features: ["HD quality", "Watch on 1 device", "Limited downloads"],
    },
    {
      id: "standard",
      name: "Standard",
      price: "₦4,500",
      period: "/month",
      features: ["Full HD quality", "Watch on 2 devices", "Unlimited downloads"],
    },
    {
      id: "premium",
      name: "Premium",
      price: "₦6,500",
      period: "/month",
      features: ["4K + HDR quality", "Watch on 4 devices", "Unlimited downloads", "Priority support"],
      popular: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className={`text-white font-semibold mb-2 ${isTv ? "text-3xl" : "text-xl"}`}>
              Current Plan
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-[#E63946] font-bold ${isTv ? "text-4xl" : "text-3xl"}`}>
                Premium
              </span>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="text-right">
            <p className={`text-white/60 mb-1 ${isTv ? "text-xl" : "text-sm"}`}>Next billing date</p>
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" />
              <span className={isTv ? "text-xl" : "text-base"}>March 26, 2026</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-[#0A0A0F] rounded-xl p-4">
            <p className={`text-white/60 mb-1 ${isTv ? "text-lg" : "text-sm"}`}>Price</p>
            <p className={`text-white font-bold ${isTv ? "text-3xl" : "text-2xl"}`}>₦6,500/mo</p>
          </div>
          <div className="bg-[#0A0A0F] rounded-xl p-4">
            <p className={`text-white/60 mb-1 ${isTv ? "text-lg" : "text-sm"}`}>Quality</p>
            <p className={`text-white font-bold ${isTv ? "text-3xl" : "text-2xl"}`}>4K + HDR</p>
          </div>
          <div className="bg-[#0A0A0F] rounded-xl p-4">
            <p className={`text-white/60 mb-1 ${isTv ? "text-lg" : "text-sm"}`}>Devices</p>
            <p className={`text-white font-bold ${isTv ? "text-3xl" : "text-2xl"}`}>4</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button className={`
            px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white
            font-semibold transition-colors border border-white/10
            ${isTv ? "text-xl" : "text-base"}
          `}>
            Change Plan
          </button>
          <button className={`
            px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60
            font-semibold transition-colors border border-white/10
            ${isTv ? "text-xl" : "text-base"}
          `}>
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
        <h3 className={`text-white font-semibold mb-6 ${isTv ? "text-3xl" : "text-xl"}`}>
          Payment Method
        </h3>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => setPaymentMethod("paystack")}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl
              border-2 transition-all
              ${paymentMethod === "paystack" 
                ? "border-[#E63946] bg-[#E63946]/10" 
                : "border-white/10 bg-[#0A0A0F] hover:bg-white/5"
              }
            `}
          >
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-white" />
              <div className="text-left">
                <p className={`text-white font-semibold ${isTv ? "text-2xl" : "text-lg"}`}>
                  Paystack
                </p>
                <p className={`text-white/60 ${isTv ? "text-lg" : "text-sm"}`}>
                  •••• 4242 • Expires 03/27
                </p>
              </div>
            </div>
            {paymentMethod === "paystack" && (
              <CheckCircle className="w-6 h-6 text-[#E63946]" />
            )}
          </button>

          <button
            onClick={() => setPaymentMethod("flutterwave")}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl
              border-2 transition-all
              ${paymentMethod === "flutterwave" 
                ? "border-[#E63946] bg-[#E63946]/10" 
                : "border-white/10 bg-[#0A0A0F] hover:bg-white/5"
              }
            `}
          >
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-white" />
              <div className="text-left">
                <p className={`text-white font-semibold ${isTv ? "text-2xl" : "text-lg"}`}>
                  Flutterwave
                </p>
                <p className={`text-white/60 ${isTv ? "text-lg" : "text-sm"}`}>
                  •••• 8888 • Expires 12/26
                </p>
              </div>
            </div>
            {paymentMethod === "flutterwave" && (
              <CheckCircle className="w-6 h-6 text-[#E63946]" />
            )}
          </button>
        </div>

        <button className={`
          px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white
          font-semibold transition-colors border border-white/10
          ${isTv ? "text-xl" : "text-base"}
        `}>
          Add Payment Method
        </button>
      </div>

      {/* Billing History */}
      <div className="bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
        <h3 className={`text-white font-semibold mb-6 ${isTv ? "text-3xl" : "text-xl"}`}>
          Billing History
        </h3>

        <div className="space-y-3">
          {[
            { date: "Feb 26, 2026", amount: "₦6,500", status: "Paid" },
            { date: "Jan 26, 2026", amount: "₦6,500", status: "Paid" },
            { date: "Dec 26, 2025", amount: "₦6,500", status: "Paid" },
          ].map((invoice, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-xl">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-white/60" />
                <span className={`text-white ${isTv ? "text-xl" : "text-base"}`}>
                  {invoice.date}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-white font-semibold ${isTv ? "text-2xl" : "text-lg"}`}>
                  {invoice.amount}
                </span>
                <span className="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
                  {invoice.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
