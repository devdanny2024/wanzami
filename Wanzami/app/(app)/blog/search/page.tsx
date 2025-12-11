'use client';

import { BlogSearchPage } from "@/components/BlogSearchPage";
import { useRouter } from "next/navigation";

export default function BlogSearchRoute() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-black">
      <BlogSearchPage
        onPostClick={(post) => router.push(`/blog/post/${post.id ?? "post"}`)}
        onBack={() => router.push("/blog")}
      />
    </div>
  );
}
