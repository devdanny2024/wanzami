import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, PlayCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const mockSeries = [
  {
    id: 1,
    title: 'Lagos Streets',
    thumbnail: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    totalEpisodes: 12,
    seasons: 2,
    status: 'Published',
  },
  {
    id: 2,
    title: 'Village Chronicles',
    thumbnail: 'https://images.unsplash.com/photo-1611517984810-0ef2ae54f9a3?w=400',
    totalEpisodes: 8,
    seasons: 1,
    status: 'Published',
  },
];

const mockEpisodes = [
  {
    id: 1,
    seriesId: 1,
    episodeName: 'The Beginning',
    episodeNumber: 1,
    season: 1,
    duration: '45:30',
    thumbnail: 'https://images.unsplash.com/photo-1628156987718-e90e05410931?w=400',
    status: 'Published',
  },
  {
    id: 2,
    seriesId: 1,
    episodeName: 'New Challenges',
    episodeNumber: 2,
    season: 1,
    duration: '42:15',
    thumbnail: 'https://images.unsplash.com/photo-1559554609-1570ffa19002?w=400',
    status: 'Published',
  },
];

export function SeriesManagement() {
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [isAddEpisodeOpen, setIsAddEpisodeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Series Management</h1>
          <p className="text-neutral-400 mt-1">Manage episodic content</p>
        </div>
        <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Series
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Series List */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">All Series</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSeries.map((series) => (
              <div
                key={series.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedSeries === series.id
                    ? 'border-[#fd7e14] bg-[#fd7e14]/10'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950'
                }`}
                onClick={() => setSelectedSeries(series.id)}
              >
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={series.thumbnail}
                    alt={series.title}
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white mb-2">{series.title}</h3>
                    <div className="space-y-1 text-sm text-neutral-400">
                      <p>{series.seasons} Season{series.seasons > 1 ? 's' : ''}</p>
                      <p>{series.totalEpisodes} Episodes</p>
                      <Badge className="bg-green-500/20 text-green-400 mt-2">
                        {series.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="ghost" className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Episodes for Selected Series */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Episodes</CardTitle>
              <p className="text-sm text-neutral-400 mt-1">
                {selectedSeries ? mockSeries.find(s => s.id === selectedSeries)?.title : 'Select a series'}
              </p>
            </div>
            {selectedSeries && (
              <Dialog open={isAddEpisodeOpen} onOpenChange={setIsAddEpisodeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Episode</DialogTitle>
                  </DialogHeader>
                  <AddEpisodeForm onClose={() => setIsAddEpisodeOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {selectedSeries ? (
              <div className="space-y-3">
                {mockEpisodes
                  .filter(ep => ep.seriesId === selectedSeries)
                  .map((episode) => (
                    <div key={episode.id} className="p-4 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors">
                      <div className="flex gap-4">
                        <div className="relative">
                          <ImageWithFallback
                            src={episode.thumbnail}
                            alt={episode.episodeName}
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                          <PlayCircle className="absolute inset-0 m-auto w-8 h-8 text-white opacity-80" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white">S{episode.season}E{episode.episodeNumber}: {episode.episodeName}</h4>
                              <p className="text-sm text-neutral-400 mt-1">Duration: {episode.duration}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 mt-2">
                            {episode.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                Select a series to view episodes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddEpisodeForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-300">Season</Label>
          <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="1" />
        </div>
        <div>
          <Label className="text-neutral-300">Episode Number</Label>
          <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="1" />
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Episode Name</Label>
        <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Enter episode name" />
      </div>

      <div>
        <Label className="text-neutral-300">Duration</Label>
        <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="45:30" />
      </div>

      <div>
        <Label className="text-neutral-300">Upload Video</Label>
        <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center bg-neutral-950">
          <p className="text-neutral-400">Drop video file here or click to browse</p>
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Upload Thumbnail</Label>
        <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center bg-neutral-950">
          <p className="text-neutral-400">Drop thumbnail here or click to browse</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button onClick={onClose} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Save Episode
        </Button>
      </div>
    </div>
  );
}
