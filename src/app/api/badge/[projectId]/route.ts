import { db } from "@/lib/db";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

// Approximate Verdana character widths at 11px
const W: Record<string, number> = {
  f: 5,
  i: 4,
  j: 4,
  l: 4,
  r: 5,
  t: 5,
  " ": 3,
  ".": 4,
  ",": 4,
  "|": 4,
  m: 10,
  w: 9,
  W: 10,
  M: 10,
};
function textWidth(s: string): number {
  return s.split("").reduce((acc, c) => acc + (W[c] ?? 7), 0);
}

function buildSVG(label: string, value: string, color: string, style: string): string {
  const isSquare = style === "flat-square";
  const isLarge = style === "for-the-badge";
  const h = isLarge ? 28 : 20;
  const r = isSquare ? 0 : 3;
  const fs = isLarge ? 10 : 11;
  const fw = isLarge ? "700" : "400";
  const lt = isLarge ? label.toUpperCase() : label;
  const vt = isLarge ? value.toUpperCase() : value;
  const lw = textWidth(lt) + (isLarge ? 20 : 16);
  const vw = textWidth(vt) + (isLarge ? 20 : 16);
  const tw = lw + vw;
  const cy = Math.round(h / 2);
  const lx = Math.round(lw / 2);
  const vx = lw + Math.round(vw / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${h}" role="img" aria-label="${label}: ${value}">
<title>${label}: ${value}</title>
<clipPath id="r"><rect width="${tw}" height="${h}" rx="${r}"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="${h}" fill="#555"/>
<rect x="${lw}" width="${vw}" height="${h}" fill="${color}"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fs}" font-weight="${fw}">
<text x="${lx}" y="${cy}" dominant-baseline="central" fill="#010101" fill-opacity=".3">${lt}</text>
<text x="${lx}" y="${cy}" dominant-baseline="central">${lt}</text>
<text x="${vx}" y="${cy}" dominant-baseline="central" fill="#010101" fill-opacity=".3">${vt}</text>
<text x="${vx}" y="${cy}" dominant-baseline="central">${vt}</text>
</g>
</svg>`;
}

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const style = new URL(req.url).searchParams.get("style") ?? "flat";
  const validStyles = ["flat", "flat-square", "for-the-badge"];
  const safeStyle = validStyles.includes(style) ? style : "flat";

  const project = await db.project.findFirst({
    where: { id: projectId, status: { not: "deleted" } },
    select: { latestScore: true },
  });

  const score = project?.latestScore;
  const value = score != null ? `${score}/100` : "unknown";
  const color = score != null ? scoreColor(score) : "#9f9f9f";
  const svg = buildSVG("AI CTO", value, color, safeStyle);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
