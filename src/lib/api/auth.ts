import { createHash } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export type ApiUser = {
  userId: string;
  plan: string;
  keyId: string;
  scopes: string[];
};

const RATE_LIMITS: Record<string, number> = {
  pro: 100,
  team: 500,
  enterprise: 2000,
};
const DEFAULT_LIMIT = 100;

const ratelimiters: Record<number, Ratelimit> = {};

function getRatelimiter(limit: number): Ratelimit {
  if (!ratelimiters[limit]) {
    ratelimiters[limit] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, "1 h"),
      prefix: "rl:api",
    });
  }
  return ratelimiters[limit]!;
}

export async function authenticateApiKey(req: Request): Promise<ApiUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("aicto_live_")) return null;

  const hash = createHash("sha256").update(rawKey).digest("hex");

  const key = await db.apiKey.findFirst({
    where: {
      keyHash: hash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, userId: true, scopes: true, user: { select: { plan: true } } },
  });

  if (!key) return null;

  void db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });

  return {
    userId: key.userId,
    plan: key.user.plan,
    keyId: key.id,
    scopes: key.scopes,
  };
}

export type PaginationParams = { cursor: string | undefined; limit: number };

export function parsePagination(url: URL): PaginationParams {
  const cursorRaw = url.searchParams.get("cursor");
  const cursor: string | undefined = cursorRaw ?? undefined;
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  return { cursor, limit };
}

export function apiResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>
) {
  return new Response(JSON.stringify({ data, meta: meta ?? null, error: null }), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
}

export function apiError(message: string, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify({ data: null, meta: null, error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
}

export async function withV1Auth(
  req: Request,
  handler: (user: ApiUser) => Promise<Response>
): Promise<Response> {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) return apiError("Invalid or missing API key", 401);

  const limit = RATE_LIMITS[apiUser.plan] ?? DEFAULT_LIMIT;
  const rl = getRatelimiter(limit);
  const { success, remaining, reset } = await rl.limit(apiUser.keyId);

  const rlHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  };

  if (!success) {
    return apiError("Rate limit exceeded", 429, {
      ...rlHeaders,
      "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
    });
  }

  const response = await handler(apiUser);
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...rlHeaders,
    },
  });
}
