import type { NextConfig } from "next";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/brand/:path*",
        destination: "/images/brand/:path*",
      },
      {
        source: "/media/:path*",
        destination: `${API_ORIGIN}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
