import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Save, Upload } from 'lucide-react';
import { TeamManagement } from './TeamManagement';
import { Badge } from './ui/badge';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">Admin Settings</h1>
        <p className="text-neutral-400 mt-1">Configure platform settings and preferences</p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Branding */}
            <AccordionItem value="branding" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Branding
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-neutral-300">Platform Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-[#fd7e14] flex items-center justify-center">
                        <span className="text-2xl text-white">W</span>
                      </div>
                      <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Logo
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-neutral-300">Primary Brand Color</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        type="color"
                        defaultValue="#fd7e14"
                        className="w-20 h-10 bg-neutral-950 border-neutral-800"
                      />
                      <Input
                        type="text"
                        defaultValue="#fd7e14"
                        className="bg-neutral-950 border-neutral-800 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-neutral-300">Platform Name</Label>
                    <Input
                      defaultValue="Wanzami"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Tagline</Label>
                    <Input
                      defaultValue="Your Premier Nigerian Streaming Platform"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Branding
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Payment Configuration */}
            <AccordionItem value="payment" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Payment Configuration
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-neutral-300">Payment Provider</Label>
                    <Select defaultValue="paystack">
                      <SelectTrigger className="mt-2 bg-neutral-950 border-neutral-800 text-white">
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
                      <SelectTrigger className="mt-2 bg-neutral-950 border-neutral-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="ngn">Nigerian Naira (NGN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-neutral-300">Public API Key</Label>
                    <Input
                      type="password"
                      placeholder="pk_live_xxxxxxxxxxxxx"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Secret API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk_live_xxxxxxxxxxxxx"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">
                      <strong className="text-[#fd7e14]">Note:</strong> All payments are processed in NGN through traditional card methods. No cryptocurrency or digital wallet support.
                    </p>
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Streaming Settings */}
            <AccordionItem value="streaming" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Streaming Settings
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-neutral-300">Video Quality</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger className="mt-2 bg-neutral-950 border-neutral-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="auto">Auto (Adaptive)</SelectItem>
                        <SelectItem value="1080p">1080p HD</SelectItem>
                        <SelectItem value="720p">720p HD</SelectItem>
                        <SelectItem value="480p">480p SD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div>
                      <Label className="text-neutral-300">Enable Download</Label>
                      <p className="text-sm text-neutral-500 mt-1">Allow users to download content</p>
                    </div>
                    <Switch className="data-[state=checked]:bg-[#fd7e14]" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div>
                      <Label className="text-neutral-300">Autoplay Next Episode</Label>
                      <p className="text-sm text-neutral-500 mt-1">Automatically play next episode</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#fd7e14]" />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Max Concurrent Streams</Label>
                    <Input
                      type="number"
                      defaultValue="3"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Streaming Settings
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Content Rules */}
            <AccordionItem value="content" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Content Rules
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div>
                      <Label className="text-neutral-300">Age Verification Required</Label>
                      <p className="text-sm text-neutral-500 mt-1">Require age verification for 18+ content</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#fd7e14]" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div>
                      <Label className="text-neutral-300">Content Warnings</Label>
                      <p className="text-sm text-neutral-500 mt-1">Display content warnings before playback</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#fd7e14]" />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Restricted Keywords</Label>
                    <Textarea
                      placeholder="Enter restricted keywords, one per line"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                      rows={4}
                    />
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Content Rules
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SEO & Meta */}
            <AccordionItem value="seo" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                SEO & Meta Info
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-neutral-300">Meta Title</Label>
                    <Input
                      defaultValue="Wanzami - Nigerian Streaming Platform"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Meta Description</Label>
                    <Textarea
                      defaultValue="Watch the best of Nigerian cinema and series. Stream movies, TV shows, and exclusive content on Wanzami."
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Keywords</Label>
                    <Input
                      defaultValue="nigerian movies, nollywood, streaming, ppv, african cinema"
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save SEO Settings
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Email Templates */}
            <AccordionItem value="email" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Email Templates
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-neutral-300">Welcome Email Template</Label>
                    <Textarea
                      placeholder="Welcome to Wanzami! ..."
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Purchase Confirmation Template</Label>
                    <Textarea
                      placeholder="Thank you for your purchase..."
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-neutral-300">Password Reset Template</Label>
                    <Textarea
                      placeholder="Reset your password..."
                      className="mt-2 bg-neutral-950 border-neutral-800 text-white"
                      rows={4}
                    />
                  </div>

                  <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Templates
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Team Members & Permissions */}
            <AccordionItem value="team" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                Team Members & Permissions
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <TeamManagement />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* System Logs */}
            <AccordionItem value="logs" className="border-neutral-800">
              <AccordionTrigger className="text-white hover:text-[#fd7e14] transition-colors">
                System Logs
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-400">2024-11-23 14:32:15</span>
                      <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                    </div>
                    <p className="text-neutral-300">Admin user logged in from 192.168.1.1</p>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-400">2024-11-23 13:15:42</span>
                      <Badge className="bg-blue-500/20 text-blue-400">Info</Badge>
                    </div>
                    <p className="text-neutral-300">New movie "The King's Legacy" published</p>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-400">2024-11-23 12:45:20</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>
                    </div>
                    <p className="text-neutral-300">Payment gateway response time exceeded threshold</p>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-400">2024-11-23 11:22:08</span>
                      <Badge className="bg-red-500/20 text-red-400">Error</Badge>
                    </div>
                    <p className="text-neutral-300">Failed payment attempt for transaction TXN-2024112303</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
