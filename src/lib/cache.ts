import { redis } from "@/lib/redis";

const TTL = {
  analysis: 86_400, // 24h
  projectAnalyses: 300, // 5min
  userProjects: 300, // 5min
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // cache failures are non-fatal
  }
}

export async function cacheInvalidate(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // non-fatal
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // non-fatal
  }
}

export const cacheKeys = {
  analysis: (id: string) => `analysis:${id}`,
  projectAnalyses: (projectId: string) => `project:${projectId}:analyses`,
  userProjects: (userId: string) => `user:${userId}:projects`,
};

export const cacheTTL = TTL;
