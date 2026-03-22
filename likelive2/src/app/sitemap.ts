import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://like-live2.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/term`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const blogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${siteUrl}/blog/${blog.id}`,
    lastModified: blog.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
