import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://like-live2.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/blog/create", "/blog/edit/", "/me/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
