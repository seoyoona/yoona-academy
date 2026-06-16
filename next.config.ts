import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — parent dirs contain stray lockfiles.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
