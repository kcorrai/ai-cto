import type { MetadataRoute } from "next";
import { env } from "@/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/leaderboard", "/explore/", "/pricing", "/s/", "/best-practices/", "/docs/"],
        disallow: ["/api/", "/dashboard", "/projects/", "/settings", "/admin/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
