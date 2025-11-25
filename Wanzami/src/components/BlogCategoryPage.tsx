import { motion } from 'motion/react';
import { ArrowLeft, Filter } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BlogPost } from './BlogHomePage';

interface BlogCategoryPageProps {
  category: string;
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
}

const categoryPosts: Record<string, BlogPost[]> = {
  "Wanzami Originals": [
    {
      id: 20,
      title: "Behind The Scenes: Making of 'The Governor'",
      image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Wanzami Originals",
      author: {
        name: "Chidi Nwosu",
        avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
      },
      date: "Nov 18, 2024",
      readTime: "6 min read",
      excerpt: "An exclusive look into the production of Wanzami's biggest political thriller...",
      views: 8200
    },
    {
      id: 21,
      title: "From Script to Screen: The Journey of Blood Sisters",
      image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Wanzami Originals",
      author: {
        name: "Kunle Afolayan",
        avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
      },
      date: "Nov 13, 2024",
      readTime: "9 min read",
      excerpt: "Director's commentary on creating one of Wanzami's most successful originals...",
      views: 11300
    },
    {
      id: 22,
      title: "Anikulapo: Bringing Yoruba Folklore to Life",
      image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Wanzami Originals",
      author: {
        name: "Ngozi Adeyemi",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 10, 2024",
      readTime: "11 min read",
      excerpt: "How traditional stories shaped this groundbreaking fantasy series...",
      views: 9700
    },
    {
      id: 23,
      title: "Lagos Vice: Crafting a Modern Crime Epic",
      image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Wanzami Originals",
      author: {
        name: "Tunde Bakare",
        avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
      },
      date: "Nov 8, 2024",
      readTime: "8 min read",
      excerpt: "The making of Wanzami's gritty action thriller set in Lagos...",
      views: 7800
    }
  ],
  "Culture": [
    {
      id: 30,
      title: "Preserving Culture Through Film: Anikulapo's Impact",
      image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Culture",
      author: {
        name: "Ngozi Adeyemi",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 17, 2024",
      readTime: "10 min read",
      excerpt: "How Yoruba folklore is finding new life in contemporary Nigerian cinema...",
      views: 6800
    },
    {
      id: 31,
      title: "Why Nigerian Stories Matter More Than Ever",
      image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Culture",
      author: {
        name: "Yemi Alade",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 14, 2024",
      readTime: "7 min read",
      excerpt: "Exploring the global impact of authentic African narratives...",
      views: 18900
    },
    {
      id: 32,
      title: "The Language of Nigerian Cinema",
      image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Culture",
      author: {
        name: "Amaka Okafor",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 12, 2024",
      readTime: "9 min read",
      excerpt: "How Nigerian films use language to tell authentic stories...",
      views: 5600
    }
  ],
  "Film Industry": [
    {
      id: 40,
      title: "The Rise of African Cinema: How Nollywood is Reshaping Global Storytelling",
      image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Film Industry",
      author: {
        name: "Amaka Okafor",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 20, 2024",
      readTime: "8 min read",
      excerpt: "Nigerian cinema has evolved from humble beginnings to become one of the world's largest film industries...",
      views: 12500
    },
    {
      id: 41,
      title: "Nollywood's Evolution: From VHS to 4K",
      image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "Film Industry",
      author: {
        name: "Ngozi Adeyemi",
        avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
      },
      date: "Nov 10, 2024",
      readTime: "12 min read",
      excerpt: "Tracing the technological journey of Nigerian cinema...",
      views: 9800
    }
  ]
};

const categoryDescriptions: Record<string, string> = {
  "Wanzami Originals": "Exclusive insights into Wanzami's original productions, from concept to screen",
  "Culture": "Exploring African culture, heritage, and identity through the lens of cinema",
  "Film Industry": "Analysis and insights into the Nigerian and African film industry",
  "Behind The Scenes": "Go behind the camera with exclusive production stories",
  "Interviews": "Conversations with the creators, actors, and visionaries shaping African cinema",
  "Technology": "How technology is transforming African streaming and content creation",
  "Reviews": "Critical analysis of the latest Nigerian and African films",
  "News": "Breaking news and updates from the world of Nollywood and African entertainment"
};

export function BlogCategoryPage({ category, onBack, onPostClick }: BlogCategoryPageProps) {
  const posts = categoryPosts[category] || [];
  const description = categoryDescriptions[category] || "Explore articles in this category";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-12">
      {/* Back Button */}
      <div className="px-4 md:px-12 lg:px-16 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full backdrop-blur-md transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-[#fd7e14] transition-colors" />
          <span>Back to Stories</span>
        </button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 md:px-12 lg:px-16 mb-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="inline-block px-4 py-2 bg-[#fd7e14]/20 border border-[#fd7e14] rounded-full mb-4">
            <span className="text-[#fd7e14]">CATEGORY</span>
          </div>
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl mb-4">
            {category}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl">
            {description}
          </p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="px-4 md:px-12 lg:px-16 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg whitespace-nowrap">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 bg-[#fd7e14] text-white rounded-lg whitespace-nowrap">
              Latest
            </button>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg whitespace-nowrap transition-all">
              Most Popular
            </button>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg whitespace-nowrap transition-all">
              Most Viewed
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-4 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onPostClick(post)}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#fd7e14] transition-all cursor-pointer group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <ImageWithFallback
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#fd7e14] text-white text-xs rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-white text-xl mb-3 group-hover:text-[#fd7e14] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 mb-4 line-clamp-2 text-sm">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-400 text-sm">{post.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                <Filter className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-white text-2xl mb-2">No posts yet</h3>
              <p className="text-gray-400">
                Check back soon for new content in this category
              </p>
            </div>
          )}

          {/* Load More */}
          {posts.length > 0 && (
            <div className="flex justify-center mt-12">
              <button className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#fd7e14] text-white rounded-xl backdrop-blur-md transition-all">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
