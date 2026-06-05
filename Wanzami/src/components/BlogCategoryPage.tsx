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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-20 sm:pt-24 pb-12">
      {/* Back Button */}
      <div className="container-page mb-6 sm:mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 min-h-[40px] bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-full backdrop-blur-md transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-brand transition-colors" />
          <span>Back to Stories</span>
        </button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-page mb-10 sm:mb-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="inline-block px-4 py-1.5 bg-brand/20 border border-brand rounded-full mb-4">
            <span className="font-heading text-brand tracking-widest text-sm">CATEGORY</span>
          </div>
          <h1 className="font-heading text-foreground text-4xl sm:text-5xl lg:text-6xl tracking-wide leading-none mb-4">
            {category}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl">
            {description}
          </p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="container-page mb-6 sm:mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button className="flex items-center gap-2 px-4 py-2 min-h-[40px] bg-white/5 border border-white/10 text-foreground rounded-lg whitespace-nowrap">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 min-h-[40px] bg-brand text-white rounded-lg whitespace-nowrap">
              Latest
            </button>
            <button className="px-4 py-2 min-h-[40px] bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg whitespace-nowrap transition-all">
              Most Popular
            </button>
            <button className="px-4 py-2 min-h-[40px] bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg whitespace-nowrap transition-all">
              Most Viewed
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container-page">
        <div className="max-w-7xl mx-auto">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onPostClick(post)}
                  className="bg-card rounded-2xl overflow-hidden border border-white/10 hover:border-brand transition-all cursor-pointer group"
                >
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <ImageWithFallback
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-brand text-white text-xs rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="font-heading text-foreground text-lg sm:text-xl tracking-wide leading-tight mb-3 group-hover:text-brand transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full shrink-0"
                        />
                        <span className="text-muted-foreground text-sm truncate">{post.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-4">
                <Filter className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-heading text-foreground text-2xl tracking-wide mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Check back soon for new content in this category
              </p>
            </div>
          )}

          {/* Load More */}
          {posts.length > 0 && (
            <div className="flex justify-center mt-10 sm:mt-12">
              <button className="px-8 py-3 min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand text-foreground rounded-xl backdrop-blur-md transition-all">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
