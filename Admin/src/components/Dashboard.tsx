import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Eye, CreditCard, DollarSign, Film, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = [
  { title: 'Total Users', value: '24,583', icon: Users, change: '+12.5%' },
  { title: 'Active Viewers Now', value: '1,847', icon: Eye, change: '+8.2%' },
  { title: 'PPV Purchases Today', value: '342', icon: CreditCard, change: '+24.3%' },
  { title: 'Total PPV Revenue', value: '₦8.4M', icon: DollarSign, change: '+18.7%' },
  { title: 'Movies & Series Count', value: '1,256', icon: Film, change: '+5.2%' },
  { title: 'Blog Posts Published', value: '89', icon: FileText, change: '+3.1%' },
];

const dailyStreams = [
  { date: 'Mon', streams: 4200 },
  { date: 'Tue', streams: 3800 },
  { date: 'Wed', streams: 5100 },
  { date: 'Thu', streams: 4600 },
  { date: 'Fri', streams: 6300 },
  { date: 'Sat', streams: 7800 },
  { date: 'Sun', streams: 6900 },
];

const dailyRevenue = [
  { date: 'Mon', revenue: 420000 },
  { date: 'Tue', revenue: 380000 },
  { date: 'Wed', revenue: 510000 },
  { date: 'Thu', revenue: 460000 },
  { date: 'Fri', revenue: 630000 },
  { date: 'Sat', revenue: 780000 },
  { date: 'Sun', revenue: 690000 },
];

const contentEngagement = [
  { hour: '00:00', views: 2400 },
  { hour: '04:00', views: 1398 },
  { hour: '08:00', views: 3800 },
  { hour: '12:00', views: 3908 },
  { hour: '16:00', views: 4800 },
  { hour: '20:00', views: 6800 },
  { hour: '23:59', views: 5200 },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-white">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-neutral-900 border-neutral-800 hover:border-[#fd7e14]/50 transition-all hover:shadow-lg hover:shadow-[#fd7e14]/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-neutral-400">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-[#fd7e14]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-white">{stat.value}</div>
                <p className="text-xs text-green-500 mt-1">{stat.change} from last week</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Streams */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Daily Streams</CardTitle>
            <p className="text-sm text-neutral-400">Last 7 days streaming activity</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStreams}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Line type="monotone" dataKey="streams" stroke="#fd7e14" strokeWidth={2} dot={{ fill: '#fd7e14' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily PPV Revenue */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Daily PPV Revenue (NGN)</CardTitle>
            <p className="text-sm text-neutral-400">Last 7 days revenue</p>
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
                  formatter={(value: number) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Bar dataKey="revenue" fill="#fd7e14" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Engagement */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Content Engagement</CardTitle>
          <p className="text-sm text-neutral-400">Hourly viewing patterns</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={contentEngagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="hour" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                labelStyle={{ color: '#a3a3a3' }}
              />
              <Area type="monotone" dataKey="views" stroke="#fd7e14" fill="#fd7e14" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
