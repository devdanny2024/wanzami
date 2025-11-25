import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { TrendingUp, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const paymentStats = [
  { title: 'Total Revenue (NGN)', value: '₦28.4M', icon: DollarSign, change: '+22.5%' },
  { title: 'Successful Transactions', value: '18,342', icon: TrendingUp, change: '+18.3%' },
  { title: 'Card Payments', value: '17,890', icon: CreditCard, change: '+19.1%' },
  { title: 'Failed Payments', value: '452', icon: AlertCircle, change: '-8.4%' },
];

const dailyRevenue = [
  { date: 'Nov 17', revenue: 3800000 },
  { date: 'Nov 18', revenue: 4200000 },
  { date: 'Nov 19', revenue: 3900000 },
  { date: 'Nov 20', revenue: 4500000 },
  { date: 'Nov 21', revenue: 4100000 },
  { date: 'Nov 22', revenue: 4800000 },
  { date: 'Nov 23', revenue: 5200000 },
];

const transactions = [
  {
    id: 1,
    date: '2024-11-23 14:32',
    user: 'Chukwudi Okonkwo',
    movie: 'The King\'s Legacy',
    amount: 1500,
    method: 'Card',
    status: 'Success',
    reference: 'TXN-2024112301',
  },
  {
    id: 2,
    date: '2024-11-23 13:15',
    user: 'Amara Johnson',
    movie: 'Lagos Streets',
    amount: 2000,
    method: 'Card',
    status: 'Success',
    reference: 'TXN-2024112302',
  },
  {
    id: 3,
    date: '2024-11-23 12:45',
    user: 'Emeka Nwachukwu',
    movie: 'Coming Home',
    amount: 1200,
    method: 'Card',
    status: 'Failed',
    reference: 'TXN-2024112303',
  },
  {
    id: 4,
    date: '2024-11-23 11:22',
    user: 'Oluchi Adeyemi',
    movie: 'City Lights',
    amount: 1500,
    method: 'Card',
    status: 'Success',
    reference: 'TXN-2024112304',
  },
  {
    id: 5,
    date: '2024-11-23 10:08',
    user: 'Tunde Bakare',
    movie: 'Desert Storm',
    amount: 1800,
    method: 'Card',
    status: 'Pending',
    reference: 'TXN-2024112305',
  },
];

export function Payments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">Payments & Transactions</h1>
        <p className="text-neutral-400 mt-1">Traditional payment processing (NGN only)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentStats.map((stat, index) => {
          const Icon = stat.icon;
          const isNegative = stat.change.startsWith('-');
          return (
            <Card key={index} className="bg-neutral-900 border-neutral-800 hover:border-[#fd7e14]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-400">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-[#fd7e14]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white">{stat.value}</div>
                <p className={`text-xs mt-1 ${isNegative ? 'text-green-500' : 'text-green-500'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Revenue Chart */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Daily PPV Revenue (NGN)</CardTitle>
          <p className="text-sm text-neutral-400">Last 7 days revenue performance</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                labelStyle={{ color: '#a3a3a3' }}
                formatter={(value: number) => `₦${(value / 1000000).toFixed(1)}M`}
              />
              <Bar dataKey="revenue" fill="#fd7e14" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Configuration */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Payment Provider Configuration</CardTitle>
          <p className="text-sm text-neutral-400">Manage payment gateway settings</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-neutral-300">Payment Provider</Label>
              <Select defaultValue="paystack">
                <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-neutral-300">Currency</Label>
              <Select defaultValue="ngn">
                <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="ngn">Nigerian Naira (NGN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <p className="text-sm text-neutral-400">
              <strong className="text-[#fd7e14]">Note:</strong> All transactions are processed in Nigerian Naira (NGN) through traditional card payment methods. No cryptocurrency or digital wallet support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
          <p className="text-sm text-neutral-400">Card transaction logs</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400">Date & Time</th>
                  <th className="text-left py-3 px-4 text-neutral-400">User</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Movie</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Amount (NGN)</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Method</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Status</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4 text-neutral-300">{transaction.date}</td>
                    <td className="py-3 px-4 text-white">{transaction.user}</td>
                    <td className="py-3 px-4 text-neutral-300">{transaction.movie}</td>
                    <td className="py-3 px-4 text-white">₦{transaction.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                        {transaction.method}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={transaction.status === 'Success' ? 'default' : 'secondary'}
                        className={
                          transaction.status === 'Success'
                            ? 'bg-green-500/20 text-green-400'
                            : transaction.status === 'Failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-300 text-sm">{transaction.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
