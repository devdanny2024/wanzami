/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // blog.wanzami.tv is retired as a destination. The blog is canonical at
      // wanzami.tv/blog, so every request on the subdomain moves there with a
      // permanent redirect and keeps its path and query. The /blog/:path* rule
      // is listed first so a visitor who already holds a /blog/... URL on the
      // subdomain does not get double-prefixed.
      {
        source: "/blog/:path*",
        has: [{ type: "host", value: "blog.wanzami.tv" }],
        destination: "https://www.wanzami.tv/blog/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "blog.wanzami.tv" }],
        destination: "https://www.wanzami.tv/blog/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      // beforeFiles so the host rule wins over the filesystem match for "/".
      beforeFiles: [
        // creator.wanzami.tv serves the creators call-sheet at its root.
        {
          source: "/",
          has: [{ type: "host", value: "creator.wanzami.tv" }],
          destination: "/creators",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
