import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { env } from "@/env";
import { getAffectedModules } from "@/lib/monitoring/smart-diff";

// Paths that are not considered meaningful code changes
const IGNORED_PATH_PATTERNS = [
  /^README/i,
  /^CHANGELOG/i,
  /^LICENSE/i,
  /^\.github\//,
  /^docs\//i,
  /\.(md|txt|rst|pdf)$/i,
];

function hasSignificantChanges(files: string[]): boolean {
  const codeFiles = files.filter((f) => !IGNORED_PATH_PATTERNS.some((re) => re.test(f)));
  return codeFiles.length > 0;
}

function verifySignature(body: string, sigHeader: string | null): boolean {
  const secret = env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret || !sigHeader) return false;
  const [algo, sig] = sigHeader.split("=");
  if (algo !== "sha256" || !sig) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

const AUTO_ANALYZE_COOLDOWN = 24 * 60 * 60; // 24 hours in seconds

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Only handle push events
  if (event !== "push") {
    return NextResponse.json({ ok: true });
  }

  let payload: {
    ref?: string;
    repository?: { full_name?: string };
    commits?: Array<{ added?: string[]; removed?: string[]; modified?: string[] }>;
    installation?: { id?: number };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const repoFullName = payload.repository?.full_name;
  const ref = payload.ref;
  const installationId = payload.installation?.id;

  if (!repoFullName || !ref || !installationId) {
    return NextResponse.json({ ok: true });
  }

  const [owner, repo] = repoFullName.split("/");
  const branch = ref.replace("refs/heads/", "");

  // Gather changed files
  const changedFiles = (payload.commits ?? []).flatMap((c) => [
    ...(c.added ?? []),
    ...(c.removed ?? []),
    ...(c.modified ?? []),
  ]);

  if (!hasSignificantChanges(changedFiles)) {
    return NextResponse.json({ skipped: "no significant changes" });
  }

  if (!owner || !repo) return NextResponse.json({ ok: true });

  // Find the project that matches this push (monitoring or auto-analyze)
  const project = await db.project.findFirst({
    where: {
      githubOwner: owner,
      githubRepo: repo,
      githubBranch: branch,
      status: "active",
      OR: [{ autoAnalyze: true }, { monitoringEnabled: true }],
    },
    select: { id: true, userId: true, monitoringEnabled: true, autoAnalyze: true },
  });

  if (!project) {
    return NextResponse.json({ ok: true });
  }

  // Monitoring mode: no cooldown, smart diff
  if (project.monitoringEnabled) {
    const affectedModules = getAffectedModules(changedFiles);
    try {
      const { triggerAnalysis } = await import("@/lib/queue/analysis");
      await triggerAnalysis(project.id, project.userId, "monitoring", affectedModules ?? undefined);
      await db.project.update({
        where: { id: project.id },
        data: { monitoringLastRun: new Date() },
      });
    } catch (err) {
      console.error("Monitoring analysis trigger failed:", err);
      return NextResponse.json({ error: "Trigger failed" }, { status: 500 });
    }
    return NextResponse.json({ triggered: true, mode: "monitoring", modules: affectedModules });
  }

  // Auto-analyze mode: 24-hour cooldown
  const cooldownKey = `auto_analyze:cooldown:${project.id}`;
  const existing = await redis.get(cooldownKey);
  if (existing) {
    return NextResponse.json({ skipped: "cooldown active" });
  }

  await redis.set(cooldownKey, "1", { ex: AUTO_ANALYZE_COOLDOWN });

  try {
    const { triggerAnalysis } = await import("@/lib/queue/analysis");
    await triggerAnalysis(project.id, project.userId, "webhook");
  } catch (err) {
    await redis.del(cooldownKey);
    console.error("Auto-analysis trigger failed:", err);
    return NextResponse.json({ error: "Trigger failed" }, { status: 500 });
  }

  return NextResponse.json({ triggered: true, mode: "auto" });
}
