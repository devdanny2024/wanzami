/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
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
