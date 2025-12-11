'use client';

import { BlogCategoryPage } from "@/components/BlogCategoryPage";
import { useRouter } from "next/navigation";

export default function BlogCategoryRoute({ params }: { params: { category: string } }) {
  const router = useRouter();
  const decoded = decodeURIComponent(params.category);

  return (
    <div className="min-h-screen bg-black">
      <BlogCategoryPage
        category={decoded}
        onPostClick={(post) => router.push(`/blog/post/${post.id ?? "post"}`)}
        onBack={() => router.push("/blog")}
      />
    </div>
  );
}
