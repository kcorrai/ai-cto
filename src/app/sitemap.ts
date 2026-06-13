import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const FRAMEWORK_SLUGS = [
    "nextjs",
    "django",
    "rails",
    "fastapi",
    "express",
    "laravel",
    "nestjs",
    "svelte",
    "vue",
    "spring",
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${appUrl}/leaderboard`, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/docs/api`, changeFrequency: "monthly", priority: 0.7 },
    ...FRAMEWORK_SLUGS.map((slug) => ({
      url: `${appUrl}/best-practices/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const projects = await db.project.findMany({
    where: {
      isPrivate: false,
      status: "active",
      githubOwner: { not: null },
      githubRepo: { not: null },
      analyses: { some: { status: "complete", isPublic: true } },
    },
    select: {
      githubOwner: true,
      githubRepo: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const analysisPages: MetadataRoute.Sitemap = projects
    .filter((p): p is typeof p & { githubOwner: string; githubRepo: string } =>
      Boolean(p.githubOwner && p.githubRepo)
    )
    .map((p) => ({
      url: `${appUrl}/explore/${p.githubOwner}/${p.githubRepo}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...analysisPages];
}
