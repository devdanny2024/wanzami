'use client';

import { BlogPostPage } from "@/components/BlogPostPage";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { BlogPost } from "@/components/BlogHomePage";

export default function BlogPostRoute({ params }: { params: { postId: string } }) {
  const router = useRouter();
  const post: BlogPost = useMemo(
    () => ({
      id: Number(params.postId) || Date.now(),
      title: `Post ${params.postId}`,
      subtitle: "",
      image: "https://placehold.co/800x450/111111/FD7E14?text=Blog+Post",
      category: "General",
      author: {
        name: "Wanzami",
        avatar: "https://placehold.co/64x64/111111/FD7E14?text=W",
      },
      date: new Date().toISOString().slice(0, 10),
      readTime: "3 min read",
      excerpt: "Content coming soon.",
    }),
    [params.postId]
  );

  return (
    <div className="min-h-screen bg-black">
      <BlogPostPage post={post} onBack={() => router.push("/blog")} />
    </div>
  );
}
