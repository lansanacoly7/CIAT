import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ciat.isepdiamniadio.sn";
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/portail`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/galerie`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/portail/actualites`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/portail/appels`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/portail/evenements`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/portail/domaines`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/portail/projets`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/portail/partenaires`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/portail/ciat`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/portail/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/portail/documents`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/confidentialite`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];
}
