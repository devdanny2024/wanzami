import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const mockBlogPosts = [
  {
    id: 1,
    title: 'The Rise of Nollywood: A Cinematic Revolution',
    coverImage: 'https://images.unsplash.com/photo-1745151485547-8d428247c1ff?w=400',
    category: 'Industry News',
    status: 'Published',
    author: 'Admin User',
    views: 12450,
    publishedDate: '2024-11-20',
  },
  {
    id: 2,
    title: '10 Must-Watch Nigerian Films This Season',
    coverImage: 'https://images.unsplash.com/photo-1611517984810-0ef2ae54f9a3?w=400',
    category: 'Recommendations',
    status: 'Published',
    author: 'Admin User',
    views: 8932,
    publishedDate: '2024-11-18',
  },
  {
    id: 3,
    title: 'Behind the Scenes: Lagos Streets Production',
    coverImage: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    category: 'Behind the Scenes',
    status: 'Draft',
    author: 'Admin User',
    views: 0,
    publishedDate: null,
  },
];

export function BlogManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Blog Management</h1>
          <p className="text-neutral-400 mt-1">Manage blog content and articles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create Blog Post</DialogTitle>
            </DialogHeader>
            <BlogEditor onClose={() => setIsAddDialogOpen(false)} />
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
              placeholder="Search blog posts..."
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts List */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400">Cover</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Title</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Category</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Status</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Author</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Views</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Date</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockBlogPosts.map((post) => (
                  <tr key={post.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <ImageWithFallback
                        src={post.coverImage}
                        alt={post.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-3 px-4 text-white max-w-xs truncate">{post.title}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                        {post.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={post.status === 'Published' ? 'default' : 'secondary'} className={post.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {post.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{post.author}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{post.publishedDate || 'Not published'}</td>
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

function BlogEditor({ onClose }: { onClose: () => void }) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-neutral-300">Cover Image</Label>
        <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950">
          <p className="text-neutral-400">Drop cover image here or click to browse</p>
          <p className="text-xs text-neutral-500 mt-1">Recommended: 1920x1080</p>
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Title</Label>
        <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Enter post title" />
      </div>

      <div>
        <Label className="text-neutral-300">Category</Label>
        <Select>
          <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-800">
            <SelectItem value="news">Industry News</SelectItem>
            <SelectItem value="recommendations">Recommendations</SelectItem>
            <SelectItem value="bts">Behind the Scenes</SelectItem>
            <SelectItem value="interviews">Interviews</SelectItem>
            <SelectItem value="reviews">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-neutral-300">Article Content</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="border-neutral-700 text-neutral-300"
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
        {previewMode ? (
          <div className="min-h-[300px] p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300">
            <p>Preview mode - article content will appear here</p>
          </div>
        ) : (
          <Textarea
            className="mt-1 bg-neutral-950 border-neutral-800 text-white min-h-[300px]"
            placeholder="Write your article content here..."
          />
        )}
      </div>

      <div className="border-t border-neutral-800 pt-4">
        <h3 className="text-white mb-3">SEO Settings</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-neutral-300">Meta Title</Label>
            <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="SEO title" />
          </div>

          <div>
            <Label className="text-neutral-300">Meta Description</Label>
            <Textarea className="mt-1 bg-neutral-950 border-neutral-800 text-white" rows={2} placeholder="SEO description" />
          </div>

          <div>
            <Label className="text-neutral-300">Keywords (comma separated)</Label>
            <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="keyword1, keyword2, keyword3" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Save Draft
        </Button>
        <Button onClick={onClose} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Publish
        </Button>
      </div>
    </div>
  );
}
