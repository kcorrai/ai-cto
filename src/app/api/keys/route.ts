import { auth } from "@clerk/nextjs/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

const MAX_KEYS = 5;

function generateApiKey() {
  const secret = randomBytes(32).toString("hex");
  const raw = `aicto_live_${secret}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.substring(0, 16);
  return { raw, hash, prefix };
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(keys);
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (user.plan === "free") {
    return Response.json({ error: "API keys require a Pro plan or higher" }, { status: 403 });
  }

  const existingCount = await db.apiKey.count({
    where: { userId: user.id, isActive: true },
  });
  if (existingCount >= MAX_KEYS) {
    return Response.json({ error: `Maximum of ${MAX_KEYS} active keys allowed` }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, scopes, expiresInDays } = body as {
    name?: string;
    scopes?: string[];
    expiresInDays?: number | null;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "Key name is required" }, { status: 400 });
  }
  if (name.length > 255) {
    return Response.json({ error: "Key name too long" }, { status: 400 });
  }

  const validScopes = ["read", "write"];
  const keyScopes =
    Array.isArray(scopes) && scopes.every((s) => validScopes.includes(s)) ? scopes : ["read"];

  let expiresAt: Date | null = null;
  if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }

  const { raw, hash, prefix } = generateApiKey();

  const key = await db.apiKey.create({
    data: {
      userId: user.id,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      scopes: keyScopes,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return Response.json({ ...key, rawKey: raw }, { status: 201 });
}
