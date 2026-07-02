/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // creator.wanzami.tv serves the creators call-sheet at its root.
      {
        source: "/",
        has: [{ type: "host", value: "creator.wanzami.tv" }],
        destination: "/creators",
      },
    ];
  },
};

export default nextConfig;
