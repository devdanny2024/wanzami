import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { TrendingUp, DollarSign, Eye, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const ppvStats = [
  { title: 'Total PPV Revenue', value: '₦8.4M', icon: DollarSign, change: '+18.7%' },
  { title: 'Active PPV Titles', value: '342', icon: Eye, change: '+12.3%' },
  { title: 'Total Purchases', value: '12,483', icon: CreditCard, change: '+24.5%' },
  { title: 'Avg. Purchase Value', value: '₦1,850', icon: TrendingUp, change: '+8.2%' },
];

const ppvMovies = [
  {
    id: 1,
    title: 'The King\'s Legacy',
    thumbnail: 'https://images.unsplash.com/photo-1611517984810-0ef2ae54f9a3?w=400',
    price: 1500,
    rentalDuration: '48h',
    purchases: 1247,
    revenue: 1870500,
    enabled: true,
  },
  {
    id: 2,
    title: 'Lagos Streets',
    thumbnail: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    price: 2000,
    rentalDuration: '72h',
    purchases: 2341,
    revenue: 4682000,
    enabled: true,
  },
  {
    id: 3,
    title: 'Coming Home',
    thumbnail: 'https://images.unsplash.com/photo-1628156987718-e90e05410931?w=400',
    price: 1200,
    rentalDuration: '24h',
    purchases: 894,
    revenue: 1072800,
    enabled: true,
  },
];

const topPerforming = [
  { title: 'Lagos Streets', purchases: 2341, revenue: 4682000 },
  { title: 'The King\'s Legacy', purchases: 1247, revenue: 1870500 },
  { title: 'Coming Home', purchases: 894, revenue: 1072800 },
  { title: 'City Lights', purchases: 756, revenue: 1134000 },
  { title: 'Desert Storm', purchases: 623, revenue: 934500 },
];

export function PPVManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">PPV Management</h1>
        <p className="text-neutral-400 mt-1">Manage Pay-Per-View content and pricing</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ppvStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-neutral-900 border-neutral-800 hover:border-[#fd7e14]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-400">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-[#fd7e14]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white">{stat.value}</div>
                <p className="text-xs text-green-500 mt-1">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PPV-Enabled Movies */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">PPV-Enabled Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-3 px-4 text-neutral-400">Movie</th>
                      <th className="text-left py-3 px-4 text-neutral-400">Price (NGN)</th>
                      <th className="text-left py-3 px-4 text-neutral-400">Duration</th>
                      <th className="text-left py-3 px-4 text-neutral-400">Purchases</th>
                      <th className="text-left py-3 px-4 text-neutral-400">Revenue (NGN)</th>
                      <th className="text-left py-3 px-4 text-neutral-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ppvMovies.map((movie) => (
                      <tr key={movie.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={movie.thumbnail}
                              alt={movie.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <span className="text-white">{movie.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">₦{movie.price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-neutral-300">{movie.rentalDuration}</td>
                        <td className="py-3 px-4 text-neutral-300">{movie.purchases.toLocaleString()}</td>
                        <td className="py-3 px-4 text-neutral-300">₦{movie.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Switch checked={movie.enabled} className="data-[state=checked]:bg-[#fd7e14]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Top Performing</CardTitle>
            <p className="text-sm text-neutral-400">Ranked by revenue</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerforming.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#fd7e14]/20 text-[#fd7e14] text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{item.title}</p>
                    <p className="text-sm text-neutral-400">{item.purchases} purchases</p>
                    <p className="text-sm text-[#fd7e14]">₦{item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotional Tools */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Promotional Tools</CardTitle>
          <p className="text-sm text-neutral-400">Manage discounts and limited-time pricing</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-300">Enable Limited-Time Discount</Label>
                <Switch className="data-[state=checked]:bg-[#fd7e14]" />
              </div>
              <div>
                <Label className="text-neutral-300">Discount Percentage</Label>
                <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="20" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-neutral-300">Start Date</Label>
                <Input type="date" className="mt-1 bg-neutral-950 border-neutral-800 text-white" />
              </div>
              <div>
                <Label className="text-neutral-300">End Date</Label>
                <Input type="date" className="mt-1 bg-neutral-950 border-neutral-800 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
