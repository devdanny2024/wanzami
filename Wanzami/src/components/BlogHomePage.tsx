import { motion } from 'motion/react';
import { Search, TrendingUp, Clock, BookOpen, ArrowRight, User } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface BlogPost {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  readTime: string;
  excerpt: string;
  isFeatured?: boolean;
  views?: number;
}

interface BlogHomePageProps {
  onPostClick: (post: BlogPost) => void;
  onCategoryClick: (category: string) => void;
  onSearchClick: () => void;
}

const featuredPost: BlogPost = {
  id: 1,
  title: "The Rise of African Cinema: How Nollywood is Reshaping Global Storytelling",
  subtitle: "From Lagos to Hollywood, Nigerian filmmakers are redefining what it means to tell authentic African stories",
  image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
  category: "Film Industry",
  author: {
    name: "Amaka Okafor",
    avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
  },
  date: "Nov 20, 2024",
  readTime: "8 min read",
  excerpt: "Nigerian cinema has evolved from humble beginnings to become one of the world's largest film industries...",
  isFeatured: true,
  views: 12500
};

const latestPosts: BlogPost[] = [
  {
    id: 2,
    title: "Behind The Scenes: Making of 'The Governor'",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Behind The Scenes",
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
    id: 3,
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
    id: 4,
    title: "The Tech Behind Wanzami: Building Africa's Streaming Future",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Technology",
    author: {
      name: "Tunde Bakare",
      avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
    },
    date: "Nov 16, 2024",
    readTime: "12 min read",
    excerpt: "Inside the infrastructure powering millions of streams across Nigeria...",
    views: 5400
  },
  {
    id: 5,
    title: "Interview: Funke Akindele on Comedy, Culture, and Connection",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Interviews",
    author: {
      name: "Amaka Okafor",
      avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
    },
    date: "Nov 15, 2024",
    readTime: "15 min read",
    excerpt: "The legendary actress shares insights on her journey and the evolution of Nollywood comedy...",
    views: 15200
  }
];

const trendingPosts: BlogPost[] = [
  {
    id: 6,
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
    id: 7,
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
  }
];

const categories = [
  { name: "Wanzami Originals", count: 24, color: "bg-[#fd7e14]" },
  { name: "Culture", count: 45, color: "bg-purple-600" },
  { name: "Film Industry", count: 38, color: "bg-blue-600" },
  { name: "Behind The Scenes", count: 31, color: "bg-green-600" },
  { name: "Interviews", count: 22, color: "bg-red-600" },
  { name: "Technology", count: 18, color: "bg-yellow-600" },
  { name: "Reviews", count: 56, color: "bg-pink-600" },
  { name: "News", count: 67, color: "bg-indigo-600" }
];

export function BlogHomePage({ onPostClick, onCategoryClick, onSearchClick }: BlogHomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-12">
      {/* Header */}
      <div className="px-4 md:px-12 lg:px-16 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl mb-3">
                Wanzami <span className="text-[#fd7e14]">Stories</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Insights, culture, and stories from the heart of African cinema
              </p>
            </div>

            {/* Search */}
            <button
              onClick={onSearchClick}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl transition-all group max-w-md w-full md:w-auto"
            >
              <Search className="w-5 h-5 text-[#fd7e14] group-hover:scale-110 transition-transform" />
              <span className="text-gray-300">Search stories...</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Featured Post */}
      <div className="px-4 md:px-12 lg:px-16 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-7xl mx-auto"
        >
          <div
            onClick={() => onPostClick(featuredPost)}
            className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden cursor-pointer group"
          >
            <ImageWithFallback
              src={featuredPost.image}
              alt={featuredPost.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fd7e14] rounded-full mb-4"
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span className="text-white text-sm tracking-wide">FEATURED STORY</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-3xl md:text-5xl lg:text-6xl mb-4 group-hover:text-[#fd7e14] transition-colors"
                >
                  {featuredPost.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-300 text-lg md:text-xl mb-6"
                >
                  {featuredPost.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-4 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-8 h-8 rounded-full border-2 border-[#fd7e14]"
                    />
                    <span className="text-white">{featuredPost.author.name}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{featuredPost.date}</span>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Hover border */}
            <div className="absolute inset-0 border-4 border-transparent group-hover:border-[#fd7e14] transition-colors rounded-3xl pointer-events-none" />
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-16">
        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-white text-2xl mb-6">Explore Topics</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onCategoryClick(category.name)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fd7e14] rounded-full text-white transition-all group"
              >
                <span className="group-hover:text-[#fd7e14] transition-colors">
                  {category.name}
                </span>
                <span className="text-gray-500 ml-2">({category.count})</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Latest Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-2xl">Latest Stories</h3>
            <button className="text-[#fd7e14] hover:text-[#e86f0f] transition-colors flex items-center gap-2">
              View All
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => onPostClick(post)}
                className="bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#fd7e14] transition-all cursor-pointer group"
              >
                <div className="relative h-64 overflow-hidden">
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
                  <h4 className="text-white text-xl mb-3 group-hover:text-[#fd7e14] transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-gray-400 mb-4 line-clamp-2">
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
        </motion.div>

        {/* Trending This Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-[#fd7e14]" />
            <h3 className="text-white text-2xl">Trending This Week</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendingPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                onClick={() => onPostClick(post)}
                className="flex gap-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-[#fd7e14] transition-all cursor-pointer group"
              >
                <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[#fd7e14] text-xs mb-2 block">
                      {post.category}
                    </span>
                    <h4 className="text-white mb-2 group-hover:text-[#fd7e14] transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{post.views?.toLocaleString()} views</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Author Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-white text-2xl mb-6">Featured Writer</h3>
          <div className="bg-gradient-to-br from-[#fd7e14]/20 to-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-[#fd7e14]/30">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <img
                src="https://images.unsplash.com/photo-1713845784782-51b36d805391?w=150&h=150&fit=crop"
                alt="Amaka Okafor"
                className="w-24 h-24 rounded-full border-4 border-[#fd7e14]"
              />
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-white text-2xl mb-2">Amaka Okafor</h4>
                <p className="text-[#fd7e14] mb-3">Film Critic & Cultural Journalist</p>
                <p className="text-gray-300 mb-4">
                  Award-winning journalist covering African cinema, with over 10 years of experience documenting the evolution of Nollywood and its global impact.
                </p>
                <div className="flex items-center gap-4 justify-center md:justify-start text-sm text-gray-400">
                  <span>42 Articles</span>
                  <span>•</span>
                  <span>250K+ Readers</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-gray-900 via-[#fd7e14]/10 to-gray-900 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-center"
        >
          <h3 className="text-white text-3xl mb-3">Stay in the Loop</h3>
          <p className="text-gray-400 mb-6">
            Get the latest stories, behind-the-scenes content, and exclusive interviews delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fd7e14] transition-colors"
            />
            <button className="px-6 py-3 bg-[#fd7e14] hover:bg-[#e86f0f] text-white rounded-xl transition-colors">
              Subscribe
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}