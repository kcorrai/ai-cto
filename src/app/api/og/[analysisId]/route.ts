import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function getLabel(score: number): string {
  if (score >= 80) return "Launch-Ready";
  if (score >= 65) return "Nearly There";
  if (score >= 50) return "Needs Work";
  if (score >= 35) return "Early Stage";
  return "Pre-Alpha";
}

export async function GET(_req: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  const analysis = await db.analysis.findFirst({
    where: { id: analysisId, status: "complete" },
    select: {
      score: true,
      completedAt: true,
      project: {
        select: { githubOwner: true, githubRepo: true },
      },
    },
  });

  const score = analysis?.score ?? 0;
  const projectName = analysis
    ? `${analysis.project.githubOwner}/${analysis.project.githubRepo}`
    : "Unknown Project";
  const label = getLabel(score);
  const color = scoreColor(score);
  const date = analysis?.completedAt
    ? new Date(analysis.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const element = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "#0a0a0a",
        padding: "48px 64px",
        fontFamily: "sans-serif",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          color: "#3b82f6",
          fontSize: 16,
          letterSpacing: 4,
          marginBottom: 32,
        },
      },
      "AI CTO"
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          color: "#f0f0f0",
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 8,
        },
      },
      projectName
    ),
    h(
      "div",
      { style: { display: "flex", color: "#606060", fontSize: 14, marginBottom: 48 } },
      `Technical Analysis Report${date ? ` · ${date}` : ""}`
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          backgroundColor: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: 16,
          padding: "32px 40px",
          marginBottom: 24,
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", gap: 8 } },
        h(
          "span",
          { style: { fontSize: 80, fontWeight: 700, color, lineHeight: 1 } },
          String(score)
        ),
        h("span", { style: { fontSize: 24, color: "#606060" } }, "/100")
      ),
      h(
        "div",
        { style: { display: "flex", color, fontSize: 14, letterSpacing: 2, marginTop: 8 } },
        label.toUpperCase()
      )
    ),
    h(
      "div",
      { style: { display: "flex", color: "#404040", fontSize: 12, marginTop: "auto" } },
      "Analyzed by AI CTO · aicto.dev"
    )
  );

  return new ImageResponse(element, { width: 1200, height: 630 });
}
