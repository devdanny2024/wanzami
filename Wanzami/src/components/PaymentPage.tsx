import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wallet, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'expired';
  image: string;
}

const transactions: Transaction[] = [
  {
    id: 1,
    title: "King of Boys",
    amount: 2500,
    currency: "NGN",
    date: "2 days ago",
    status: "completed",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 2,
    title: "Lagos Nights",
    amount: 3000,
    currency: "NGN",
    date: "5 days ago",
    status: "expired",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 3,
    title: "Heritage",
    amount: 2000,
    currency: "NGN",
    date: "1 week ago",
    status: "completed",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

export function PaymentPage() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'history'>('wallet');
  const [walletBalance] = useState(15000);

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-white text-3xl md:text-4xl mb-2">Payment & Wallet</h1>
          <p className="text-gray-400">Manage your PPV purchases and payment methods</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeTab === 'wallet'
                ? 'bg-[#fd7e14] text-white'
                : 'bg-gray-900/50 text-gray-400 hover:text-white'
            }`}
          >
            Wallet & Payment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-[#fd7e14] text-white'
                : 'bg-gray-900/50 text-gray-400 hover:text-white'
            }`}
          >
            Transaction History
          </button>
        </div>

        {activeTab === 'wallet' ? (
          <div className="space-y-6">
            {/* Wallet Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#fd7e14] to-[#e86f0f] rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/80 mb-2">Wanzami Wallet Balance</p>
                  <div className="text-white text-4xl md:text-5xl">
                    ₦{walletBalance.toLocaleString()}
                  </div>
                </div>
                <Wallet className="w-12 h-12 text-white/60" />
              </div>
              <button className="w-full md:w-auto bg-white text-[#fd7e14] px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                Add Funds
              </button>
            </motion.div>

            {/* Payment Methods */}
            <div>
              <h2 className="text-white text-xl md:text-2xl mb-4">Payment Methods</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card Payment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-[#fd7e14]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fd7e14]/20 flex items-center justify-center group-hover:bg-[#fd7e14]/30 transition-colors">
                      <CreditCard className="w-6 h-6 text-[#fd7e14]" />
                    </div>
                    <div>
                      <h3 className="text-white">Card Payment</h3>
                      <p className="text-gray-400 text-sm">Visa, Mastercard, Verve</p>
                    </div>
                  </div>
                  <button className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                    Add Card
                  </button>
                </motion.div>

                {/* Wallet Payment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-[#fd7e14]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fd7e14]/20 flex items-center justify-center group-hover:bg-[#fd7e14]/30 transition-colors">
                      <Wallet className="w-6 h-6 text-[#fd7e14]" />
                    </div>
                    <div>
                      <h3 className="text-white">Mobile Wallet</h3>
                      <p className="text-gray-400 text-sm">Flutterwave, Paystack</p>
                    </div>
                  </div>
                  <button className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                    Connect Wallet
                  </button>
                </motion.div>

                {/* Crypto Payment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-[#fd7e14]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fd7e14]/20 flex items-center justify-center group-hover:bg-[#fd7e14]/30 transition-colors">
                      <DollarSign className="w-6 h-6 text-[#fd7e14]" />
                    </div>
                    <div>
                      <h3 className="text-white">Cryptocurrency</h3>
                      <p className="text-gray-400 text-sm">USDC, Bitcoin, Ethereum</p>
                    </div>
                  </div>
                  <button className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                    Add Crypto
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400">Total Spent</p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-white text-2xl">₦7,500</div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400">Movies Rented</p>
                  <CheckCircle className="w-5 h-5 text-[#fd7e14]" />
                </div>
                <div className="text-white text-2xl">3</div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400">Active Rentals</p>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-white text-2xl">1</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-white text-xl md:text-2xl mb-4">Recent Transactions</h2>
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-12 md:w-24 md:h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={transaction.image}
                      alt={transaction.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white mb-1 truncate">{transaction.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span className={`${
                        transaction.status === 'completed' ? 'text-green-500' :
                        transaction.status === 'expired' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white">
                      {transaction.currency === 'NGN' ? '₦' : '$'}
                      {transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-sm">{transaction.currency}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
