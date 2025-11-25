import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Flag, MessageSquare, Shield, CheckCircle, XCircle } from 'lucide-react';

const flaggedComments = [
  {
    id: 1,
    user: 'Anonymous User',
    movie: 'The King\'s Legacy',
    comment: 'This movie is terrible and waste of time',
    reason: 'Spam',
    reportedBy: 'User123',
    date: '2024-11-23 10:30',
    status: 'Pending',
  },
  {
    id: 2,
    user: 'MovieFan456',
    movie: 'Lagos Streets',
    comment: 'Inappropriate content warning needed',
    reason: 'Inappropriate Content',
    reportedBy: 'User456',
    date: '2024-11-23 09:15',
    status: 'Pending',
  },
  {
    id: 3,
    user: 'CriticPro',
    movie: 'Coming Home',
    comment: 'Spoiler alert: the ending is predictable',
    reason: 'Spoilers',
    reportedBy: 'User789',
    date: '2024-11-22 18:45',
    status: 'Pending',
  },
];

const reviews = [
  {
    id: 1,
    user: 'Chukwudi Okonkwo',
    movie: 'The King\'s Legacy',
    rating: 5,
    review: 'Outstanding performance by the lead actors. A must-watch!',
    date: '2024-11-23',
    status: 'Approved',
  },
  {
    id: 2,
    user: 'Amara Johnson',
    movie: 'Lagos Streets',
    rating: 4,
    review: 'Great cinematography and compelling storyline.',
    date: '2024-11-22',
    status: 'Approved',
  },
  {
    id: 3,
    user: 'Emeka Nwachukwu',
    movie: 'Coming Home',
    rating: 3,
    review: 'Good movie but pacing could be better.',
    date: '2024-11-21',
    status: 'Pending',
  },
];

const suspiciousActivity = [
  {
    id: 1,
    user: 'SuspiciousUser123',
    activity: 'Multiple failed payment attempts',
    severity: 'High',
    date: '2024-11-23 11:20',
  },
  {
    id: 2,
    user: 'SpamBot456',
    activity: 'Posting identical comments on multiple movies',
    severity: 'Medium',
    date: '2024-11-23 10:05',
  },
  {
    id: 3,
    user: 'AccountSharer789',
    activity: 'Login from 5+ different locations within 1 hour',
    severity: 'High',
    date: '2024-11-22 22:30',
  },
];

export function Moderation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">Moderation System</h1>
        <p className="text-neutral-400 mt-1">Manage comments, reviews, and reports</p>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-neutral-400">Pending Reports</CardTitle>
            <Flag className="w-4 h-4 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white">23</div>
            <p className="text-xs text-neutral-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-neutral-400">Total Comments</CardTitle>
            <MessageSquare className="w-4 h-4 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white">8,342</div>
            <p className="text-xs text-green-500 mt-1">+12.3% this week</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-neutral-400">Suspicious Activity</CardTitle>
            <Shield className="w-4 h-4 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white">7</div>
            <p className="text-xs text-red-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-neutral-400">Auto-Filtered</CardTitle>
            <CheckCircle className="w-4 h-4 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white">156</div>
            <p className="text-xs text-neutral-500 mt-1">By profanity filter</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="bg-neutral-800 border-neutral-700">
              <TabsTrigger value="comments" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                Flagged Comments
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                Suspicious Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-6">
              <div className="space-y-4">
                {flaggedComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white">{comment.user}</span>
                          <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 text-xs">
                            on {comment.movie}
                          </Badge>
                        </div>
                        <p className="text-neutral-400 text-sm">{comment.date}</p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400">
                        {comment.reason}
                      </Badge>
                    </div>
                    
                    <div className="mb-3 p-3 bg-neutral-900 rounded border border-neutral-800">
                      <p className="text-neutral-300">{comment.comment}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-500">Reported by: {comment.reportedBy}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                          <XCircle className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white">{review.user}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < review.rating ? 'text-[#fd7e14]' : 'text-neutral-700'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-neutral-400 text-sm">{review.movie} • {review.date}</p>
                      </div>
                      <Badge 
                        className={review.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                      >
                        {review.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-3 p-3 bg-neutral-900 rounded border border-neutral-800">
                      <p className="text-neutral-300">{review.review}</p>
                    </div>

                    {review.status === 'Pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="space-y-4">
                {suspiciousActivity.map((activity) => (
                  <div key={activity.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white">{activity.user}</span>
                          <Badge 
                            className={
                              activity.severity === 'High' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }
                          >
                            {activity.severity}
                          </Badge>
                        </div>
                        <p className="text-neutral-400 text-sm">{activity.date}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3 p-3 bg-neutral-900 rounded border border-neutral-800">
                      <p className="text-neutral-300">{activity.activity}</p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300">
                        Investigate
                      </Button>
                      <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                        Suspend Account
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Profanity Filter */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Auto-Filter Settings</CardTitle>
          <p className="text-sm text-neutral-400">Configure automatic content moderation</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <Label className="text-neutral-300">Profanity Filter</Label>
              <p className="text-sm text-neutral-500 mt-1">Automatically filter profane language</p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-[#fd7e14]" />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <Label className="text-neutral-300">Spam Detection</Label>
              <p className="text-sm text-neutral-500 mt-1">Detect and flag repetitive comments</p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-[#fd7e14]" />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <Label className="text-neutral-300">Auto-Approve Reviews</Label>
              <p className="text-sm text-neutral-500 mt-1">Automatically approve reviews from trusted users</p>
            </div>
            <Switch className="data-[state=checked]:bg-[#fd7e14]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
