import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const mockMovies = [
  {
    id: 1,
    thumbnail: 'https://images.unsplash.com/photo-1611517984810-0ef2ae54f9a3?w=400',
    title: 'The King\'s Legacy',
    type: 'Movie',
    category: 'Drama',
    status: 'Published',
    ppvEnabled: true,
    price: 1500,
    lastUpdated: '2024-11-20',
  },
  {
    id: 2,
    thumbnail: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    title: 'Lagos Streets',
    type: 'Series',
    category: 'Action',
    status: 'Published',
    ppvEnabled: true,
    price: 2000,
    lastUpdated: '2024-11-22',
  },
  {
    id: 3,
    thumbnail: 'https://images.unsplash.com/photo-1628156987718-e90e05410931?w=400',
    title: 'Coming Home',
    type: 'Movie',
    category: 'Romance',
    status: 'Draft',
    ppvEnabled: false,
    price: 0,
    lastUpdated: '2024-11-15',
  },
];

export function MoviesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Movies Management</h1>
          <p className="text-neutral-400 mt-1">Manage all content on the platform</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Movie
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Add/Edit Movie</DialogTitle>
            </DialogHeader>
            <AddEditMovieForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              type="search"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movies Table */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">All Movies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400">Thumbnail</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Title</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Type</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Category</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Status</th>
                  <th className="text-left py-3 px-4 text-neutral-400">PPV</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Price (NGN)</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Last Updated</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockMovies.map((movie) => (
                  <tr key={movie.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <ImageWithFallback
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-3 px-4 text-white">{movie.title}</td>
                    <td className="py-3 px-4 text-neutral-300">{movie.type}</td>
                    <td className="py-3 px-4 text-neutral-300">{movie.category}</td>
                    <td className="py-3 px-4">
                      <Badge variant={movie.status === 'Published' ? 'default' : 'secondary'} className={movie.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-300'}>
                        {movie.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={movie.ppvEnabled ? 'default' : 'secondary'} className={movie.ppvEnabled ? 'bg-[#fd7e14]/20 text-[#fd7e14]' : 'bg-neutral-700 text-neutral-400'}>
                        {movie.ppvEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">₦{movie.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-neutral-300">{movie.lastUpdated}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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

function AddEditMovieForm({ onClose }: { onClose: () => void }) {
  const [ppvEnabled, setPpvEnabled] = useState(false);

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="bg-neutral-800 border-neutral-700">
        <TabsTrigger value="basic" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">Basic Info</TabsTrigger>
        <TabsTrigger value="media" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">Media Uploads</TabsTrigger>
        <TabsTrigger value="metadata" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">Metadata & SEO</TabsTrigger>
        <TabsTrigger value="restrictions" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">Restrictions</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Title</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Enter movie title" />
        </div>

        <div>
          <Label className="text-neutral-300">Description</Label>
          <Textarea className="mt-1 bg-neutral-950 border-neutral-800 text-white" rows={4} placeholder="Enter movie description" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300">Genre</Label>
            <Select>
              <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="drama">Drama</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="thriller">Thriller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-neutral-300">Release Year</Label>
            <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="2024" />
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Cast List (comma separated)</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Actor 1, Actor 2, Actor 3" />
        </div>

        <div className="border-t border-neutral-800 pt-4 mt-4">
          <h3 className="text-white mb-4">PPV Settings</h3>
          
          <div className="flex items-center justify-between mb-4">
            <Label className="text-neutral-300">Enable PPV</Label>
            <Switch checked={ppvEnabled} onCheckedChange={setPpvEnabled} className="data-[state=checked]:bg-[#fd7e14]" />
          </div>

          {ppvEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-neutral-300">Price (NGN)</Label>
                  <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="1500" />
                </div>

                <div>
                  <Label className="text-neutral-300">Rental Period</Label>
                  <Select>
                    <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="72h">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="media" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Upload Video File</Label>
          <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950">
            <p className="text-neutral-400">Drop video file here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">MP4, MOV, AVI (Max 5GB)</p>
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Poster</Label>
          <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950">
            <p className="text-neutral-400">Drop poster image here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG (Recommended: 1080x1920)</p>
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Thumbnail</Label>
          <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950">
            <p className="text-neutral-400">Drop thumbnail image here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG (Recommended: 1920x1080)</p>
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Trailer URL</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="https://youtube.com/..." />
        </div>
      </TabsContent>

      <TabsContent value="metadata" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Meta Title</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="SEO title" />
        </div>

        <div>
          <Label className="text-neutral-300">Meta Description</Label>
          <Textarea className="mt-1 bg-neutral-950 border-neutral-800 text-white" rows={3} placeholder="SEO description" />
        </div>

        <div>
          <Label className="text-neutral-300">Keywords (comma separated)</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="keyword1, keyword2, keyword3" />
        </div>
      </TabsContent>

      <TabsContent value="restrictions" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Age Rating</Label>
          <Select>
            <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              <SelectItem value="g">General (G)</SelectItem>
              <SelectItem value="pg">Parental Guidance (PG)</SelectItem>
              <SelectItem value="pg13">PG-13</SelectItem>
              <SelectItem value="18">18+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-neutral-300">Content Warnings</Label>
          <Textarea className="mt-1 bg-neutral-950 border-neutral-800 text-white" rows={3} placeholder="List any content warnings" />
        </div>
      </TabsContent>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button onClick={onClose} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Save Movie
        </Button>
      </div>
    </Tabs>
  );
}
