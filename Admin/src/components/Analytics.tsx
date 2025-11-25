import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Users, Monitor, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const stats = [
  { title: 'Total Streams', value: '342.5K', icon: TrendingUp, change: '+28.4%' },
  { title: 'Active Users', value: '24,583', icon: Users, change: '+12.5%' },
  { title: 'Avg. Watch Time', value: '42m', icon: Monitor, change: '+8.2%' },
  { title: 'Top Region', value: 'Lagos', icon: MapPin, change: '34.2%' },
];

const streamsOverTime = [
  { date: 'Week 1', streams: 45000 },
  { date: 'Week 2', streams: 52000 },
  { date: 'Week 3', streams: 49000 },
  { date: 'Week 4', streams: 61000 },
  { date: 'Week 5', streams: 58000 },
  { date: 'Week 6', streams: 67000 },
  { date: 'Week 7', streams: 72000 },
];

const deviceUsage = [
  { device: 'Mobile', value: 45, color: '#fd7e14' },
  { device: 'Desktop', value: 30, color: '#ff9940' },
  { device: 'Tablet', value: 15, color: '#ffc080' },
  { device: 'Smart TV', value: 10, color: '#ffd9b3' },
];

const stateData = [
  { state: 'Lagos', viewers: 8420 },
  { state: 'Abuja', viewers: 5230 },
  { state: 'Port Harcourt', viewers: 4180 },
  { state: 'Ibadan', viewers: 3560 },
  { state: 'Kano', viewers: 2940 },
  { state: 'Benin City', viewers: 2350 },
];

const topContent = [
  { title: 'The King\'s Legacy', views: 24580, engagement: 92 },
  { title: 'Lagos Streets', views: 21340, engagement: 88 },
  { title: 'Coming Home', views: 18920, engagement: 85 },
  { title: 'City Lights', views: 16750, engagement: 82 },
  { title: 'Desert Storm', views: 14230, engagement: 79 },
];

const viewerActivity = [
  { hour: '00:00', views: 1200 },
  { hour: '03:00', views: 800 },
  { hour: '06:00', views: 2500 },
  { hour: '09:00', views: 5200 },
  { hour: '12:00', views: 6800 },
  { hour: '15:00', views: 7500 },
  { hour: '18:00', views: 9200 },
  { hour: '21:00', views: 11500 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">Analytics</h1>
        <p className="text-neutral-400 mt-1">Platform performance and user insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streams Over Time */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Streams Over Time</CardTitle>
            <p className="text-sm text-neutral-400">Weekly streaming trends</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={streamsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Line type="monotone" dataKey="streams" stroke="#fd7e14" strokeWidth={3} dot={{ fill: '#fd7e14', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Device Usage Analytics</CardTitle>
            <p className="text-sm text-neutral-400">Platform distribution</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, value }) => `${device} ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geography - Nigerian States */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Geography (Nigeria States)</CardTitle>
            <p className="text-sm text-neutral-400">Viewers by state</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis type="number" stroke="#a3a3a3" />
                <YAxis type="category" dataKey="state" stroke="#a3a3a3" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Bar dataKey="viewers" fill="#fd7e14" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Viewer Activity Heatmap */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Viewer Activity Heatmap</CardTitle>
            <p className="text-sm text-neutral-400">Peak viewing hours</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewerActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="hour" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Bar dataKey="views" fill="#fd7e14" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Popularity */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Content Popularity Ranking</CardTitle>
          <p className="text-sm text-neutral-400">Top performing content</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topContent.map((content, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#fd7e14]/20 text-[#fd7e14]">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{content.title}</span>
                    <span className="text-neutral-400">{content.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#fd7e14] rounded-full transition-all"
                        style={{ width: `${content.engagement}%` }}
                      />
                    </div>
                    <span className="text-sm text-neutral-500 w-12">{content.engagement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PPV Performance */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">PPV Performance</CardTitle>
          <p className="text-sm text-neutral-400">Revenue and conversion metrics</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <p className="text-sm text-neutral-400 mb-1">Conversion Rate</p>
              <p className="text-2xl text-white">8.4%</p>
              <p className="text-xs text-green-500 mt-1">+2.1% from last month</p>
            </div>
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <p className="text-sm text-neutral-400 mb-1">Avg. Revenue per User</p>
              <p className="text-2xl text-white">₦1,850</p>
              <p className="text-xs text-green-500 mt-1">+5.3% from last month</p>
            </div>
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <p className="text-sm text-neutral-400 mb-1">Total PPV Revenue</p>
              <p className="text-2xl text-white">₦8.4M</p>
              <p className="text-xs text-green-500 mt-1">+18.7% from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
