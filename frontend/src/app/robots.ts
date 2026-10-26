import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/portail",
        "/portail/*",
        "/galerie",
        "/galerie/*",
        "/mentions-legales",
        "/confidentialite",
      ],
      disallow: [
        "/tableau-de-bord",
        "/tableau-de-bord/*",
        "/incubateur/*",
        "/assistant",
        "/api/*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
