import { motion } from 'motion/react';
import { ArrowLeft, Clock, Share2, Twitter, Facebook, Link2, BookmarkPlus, User } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BlogPost } from './BlogHomePage';

interface BlogPostPageProps {
  post: BlogPost | null;
  onBack: () => void;
  onPostClick?: (post: BlogPost) => void;
}

const relatedPosts: BlogPost[] = [
  {
    id: 10,
    title: "The Future of African Streaming Platforms",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Technology",
    author: {
      name: "Tunde Bakare",
      avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
    },
    date: "Nov 12, 2024",
    readTime: "8 min read",
    excerpt: "How local platforms are competing with global giants...",
    views: 7200
  },
  {
    id: 11,
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
  },
  {
    id: 12,
    title: "Authentic Storytelling in Modern African Cinema",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Culture",
    author: {
      name: "Amaka Okafor",
      avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
    },
    date: "Nov 8, 2024",
    readTime: "10 min read",
    excerpt: "Why representation matters in film and television...",
    views: 11400
  }
];

export function BlogPostPage({ post, onBack, onPostClick }: BlogPostPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Back Button */}
      <div className="fixed top-24 left-4 md:left-12 z-40">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-black/80 hover:bg-black border border-white/20 hover:border-[#fd7e14] text-white rounded-full backdrop-blur-md transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:text-[#fd7e14] transition-colors" />
          <span className="hidden md:inline">Back to Stories</span>
        </motion.button>
      </div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[60vh] md:h-[70vh]"
      >
        <ImageWithFallback
          src={post?.image}
          alt={post?.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </motion.div>

      {/* Article Content */}
      <div className="relative -mt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {/* Category */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-[#fd7e14] text-white text-sm rounded-full">
                {post?.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl mb-6">
              {post?.title}
            </h1>

            {/* Subtitle */}
            {post?.subtitle && (
              <p className="text-gray-300 text-xl md:text-2xl mb-8">
                {post.subtitle}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={post?.author.avatar}
                  alt={post?.author.name}
                  className="w-12 h-12 rounded-full border-2 border-[#fd7e14]"
                />
                <div>
                  <div className="text-white">{post?.author.name}</div>
                  <div className="text-gray-500 text-sm">Film Critic & Journalist</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span>{post?.date}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{post?.readTime}</span>
                </div>
                {post?.views && (
                  <>
                    <span>•</span>
                    <span>{post.views.toLocaleString()} views</span>
                  </>
                )}
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-3 pt-6 border-t border-white/10">
              <span className="text-gray-400 text-sm">Share:</span>
              <button className="w-10 h-10 bg-white/10 hover:bg-[#1DA1F2] border border-white/20 hover:border-[#1DA1F2] rounded-full flex items-center justify-center transition-all group">
                <Twitter className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-[#1877F2] border border-white/20 hover:border-[#1877F2] rounded-full flex items-center justify-center transition-all group">
                <Facebook className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-[#fd7e14] border border-white/20 hover:border-[#fd7e14] rounded-full flex items-center justify-center transition-all group">
                <Link2 className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-[#fd7e14] border border-white/20 hover:border-[#fd7e14] rounded-full flex items-center justify-center transition-all group ml-auto">
                <BookmarkPlus className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>

          {/* Article Body */}
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose prose-invert prose-lg md:prose-xl max-w-none"
          >
            {/* Main content - this would come from a CMS */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 mb-8">
              <p className="text-gray-300 leading-relaxed mb-6">
                Nigerian cinema has evolved from humble beginnings in the late 20th century to become one of the world's largest film industries by volume, rivaling both Hollywood and Bollywood. What started as a grassroots movement of filmmakers selling VHS tapes in local markets has transformed into a billion-dollar industry that captivates audiences across Africa and beyond.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                The journey of Nollywood is one of resilience, creativity, and cultural pride. In the face of limited resources and infrastructure, Nigerian filmmakers found innovative ways to tell their stories, creating a unique cinematic language that resonated with audiences hungry for authentic African narratives.
              </p>

              <div className="my-12 border-l-4 border-[#fd7e14] pl-6">
                <p className="text-white text-2xl italic">
                  "Nollywood is not just an industry; it's a movement. It's about reclaiming our narratives and showing the world the depth and diversity of African stories."
                </p>
                <p className="text-gray-500 mt-3">— Kunle Afolayan, Award-winning Director</p>
              </div>

              <h2 className="text-white text-3xl mb-4 mt-12">The Digital Revolution</h2>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                The advent of digital technology marked a turning point for Nollywood. Filmmakers gained access to better equipment, editing software, and distribution channels. Streaming platforms like Wanzami have democratized access to Nigerian content, allowing stories from Lagos, Abuja, and beyond to reach global audiences instantly.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                This technological leap hasn't just improved production quality; it's transformed the entire ecosystem. Today's Nollywood productions feature world-class cinematography, sophisticated storytelling, and production values that rival international standards while maintaining the cultural authenticity that makes Nigerian cinema unique.
              </p>

              {/* Inline Image */}
              <div className="my-12 rounded-xl overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Nigerian film production"
                  className="w-full h-auto"
                />
                <p className="text-gray-500 text-sm mt-3 text-center italic">
                  Modern Nollywood productions blend traditional storytelling with cutting-edge technology
                </p>
              </div>

              <h2 className="text-white text-3xl mb-4 mt-12">Cultural Impact and Global Recognition</h2>

              <p className="text-gray-300 leading-relaxed mb-6">
                The impact of Nollywood extends far beyond entertainment. It has become a cultural ambassador, reshaping global perceptions of Africa and providing a counter-narrative to stereotypical portrayals. Nigerian films explore complex themes—from family dynamics and romance to political intrigue and social issues—with nuance and authenticity.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                International recognition has followed this cultural impact. Nigerian films and filmmakers are winning awards at prestigious festivals worldwide. Collaborations with international studios are becoming more common, yet the industry has maintained its distinct voice and perspective.
              </p>

              <h2 className="text-white text-3xl mb-4 mt-12">The Future is Bright</h2>

              <p className="text-gray-300 leading-relaxed mb-6">
                As we look to the future, Nollywood's trajectory is undeniably upward. Investment in local production is increasing, film schools are nurturing new talent, and platforms like Wanzami are providing sustainable distribution models that ensure creators can build lasting careers.
              </p>

              <p className="text-gray-300 leading-relaxed mb-6">
                The stories that emerge from Nigeria—and the broader African continent—are no longer peripheral to global cinema. They are central, essential, and increasingly influential. This is not just the rise of an industry; it's the affirmation of a truth that has always existed: African stories matter, and the world is finally listening.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-12">
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 text-sm rounded-full">
                #Nollywood
              </span>
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 text-sm rounded-full">
                #AfricanCinema
              </span>
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 text-sm rounded-full">
                #FilmIndustry
              </span>
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 text-sm rounded-full">
                #CulturalIdentity
              </span>
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 text-sm rounded-full">
                #Streaming
              </span>
            </div>

            {/* Author Bio */}
            <div className="bg-gradient-to-br from-[#fd7e14]/20 to-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-[#fd7e14]/30 mb-12">
              <div className="flex gap-4 items-start">
                <img
                  src={post?.author.avatar}
                  alt={post?.author.name}
                  className="w-16 h-16 rounded-full border-2 border-[#fd7e14]"
                />
                <div className="flex-1">
                  <h3 className="text-white text-xl mb-1">{post?.author.name}</h3>
                  <p className="text-[#fd7e14] text-sm mb-2">Film Critic & Cultural Journalist</p>
                  <p className="text-gray-300 text-sm mb-3">
                    Award-winning journalist covering African cinema, with over 10 years of experience documenting the evolution of Nollywood and its global impact.
                  </p>
                  <button className="text-[#fd7e14] hover:text-[#e86f0f] text-sm transition-colors">
                    Follow →
                  </button>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            <div className="border-t border-white/10 pt-12">
              <h3 className="text-white text-2xl md:text-3xl mb-8">Continue Reading</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <div
                    key={relatedPost.id}
                    onClick={() => onPostClick?.(relatedPost)}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-[#fd7e14] transition-all cursor-pointer group"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <ImageWithFallback
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-[#fd7e14] text-white text-xs rounded">
                          {relatedPost.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-white mb-2 group-hover:text-[#fd7e14] transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{relatedPost.readTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-white/10 pt-12 mt-12">
              <h3 className="text-white text-2xl mb-6">Join the Conversation</h3>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
                <textarea
                  placeholder="Share your thoughts..."
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#fd7e14] transition-colors resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button className="px-6 py-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white rounded-lg transition-colors">
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Sample Comments */}
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white">Chioma Eze</span>
                        <span className="text-gray-500 text-sm">2 hours ago</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Excellent article! As a Nigerian filmmaker, I've witnessed this evolution firsthand. The digital revolution has truly democratized our industry.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white">David Okonkwo</span>
                        <span className="text-gray-500 text-sm">5 hours ago</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        I love how platforms like Wanzami are making our stories accessible globally. The future of African cinema is incredibly bright!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </div>
  );
}