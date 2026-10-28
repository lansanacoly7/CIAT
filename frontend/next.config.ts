import type { NextConfig } from "next";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  /* config options here */
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
  async redirects() {
    return [
      {
        source: "/domaines",
        destination: "/portail/domaines",
        permanent: true,
      },
      {
        source: "/ciat",
        destination: "/portail/ciat",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/portail/contact",
        permanent: true,
      },
      {
        source: "/actualites",
        destination: "/portail/actualites",
        permanent: true,
      },
      {
        source: "/partenaires",
        destination: "/portail/partenaires",
        permanent: true,
      },
    ];
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
