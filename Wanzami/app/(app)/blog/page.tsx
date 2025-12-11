'use client';

import { BlogHomePage } from "@/components/BlogHomePage";
import { useRouter } from "next/navigation";

export default function BlogRoute() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-black">
      <BlogHomePage
        onPostClick={(post) => router.push(`/blog/post/${post.id ?? "post"}`)}
        onCategoryClick={(category) => router.push(`/blog/category/${encodeURIComponent(category)}`)}
        onSearchClick={() => router.push("/blog/search")}
      />
    </div>
  );
}
