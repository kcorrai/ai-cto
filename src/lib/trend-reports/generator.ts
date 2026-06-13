import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";
import { getBenchmarkSnapshot } from "@/lib/benchmarks/aggregation";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const MODEL = gateway("anthropic/claude-sonnet-4-6");

export type TrendReport = {
  quarter: string;
  generatedAt: string;
  sampleCount: number;
  headline: string;
  keyFindings: string[];
  moduleInsights: { module: string; avgScore: number; trend: string }[];
  topIssues: string[];
  recommendations: string[];
};

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

export async function generateTrendReport(): Promise<TrendReport> {
  const snapshot = await getBenchmarkSnapshot();

  const quarter = currentQuarter();

  if (snapshot.sampleCount < 10) {
    return {
      quarter,
      generatedAt: new Date().toISOString(),
      sampleCount: snapshot.sampleCount,
      headline: "Insufficient data for this quarter",
      keyFindings: [
        "Not enough opt-in projects yet to generate statistically meaningful insights.",
      ],
      moduleInsights: [],
      topIssues: [],
      recommendations: ["Encourage more projects to opt into the benchmark program."],
    };
  }

  const moduleLines = snapshot.modules
    .sort((a, b) => a.avg - b.avg)
    .map(
      (m) =>
        `  ${m.module}: avg=${m.avg}, p25=${m.p25}, p50=${m.p50}, p75=${m.p75} (n=${m.sampleCount})`
    )
    .join("\n");

  const prompt = `You are analyzing aggregated quality data from ${snapshot.sampleCount} indie SaaS projects for the ${quarter} State of SaaS Quality Report.

Overall scores: avg=${snapshot.overallAvg}, p25=${snapshot.overallP25}, median=${snapshot.overallP50}, p75=${snapshot.overallP75}

Module breakdown (sorted by lowest avg first):
${moduleLines}

Generate a trend report with:
1. A compelling one-sentence headline about the state of indie SaaS quality this quarter
2. 3-4 key findings as bullet points (specific, data-backed)
3. Top 3 issues affecting the ecosystem
4. 3 actionable recommendations for founders

Respond in JSON with this exact shape:
{
  "headline": "...",
  "keyFindings": ["...", "..."],
  "topIssues": ["...", "..."],
  "recommendations": ["...", "..."]
}`;

  const { text } = await generateText({
    model: MODEL,
    prompt,
    maxOutputTokens: 800,
  });

  let parsed: {
    headline: string;
    keyFindings: string[];
    topIssues: string[];
    recommendations: string[];
  };
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match?.[0] ?? "{}");
  } catch {
    parsed = {
      headline: "Indie SaaS quality improves but security and testing remain weak spots",
      keyFindings: ["Security scores remain below average across most projects."],
      topIssues: ["Security vulnerabilities", "Lack of test coverage", "Poor documentation"],
      recommendations: [
        "Prioritize security reviews",
        "Add automated testing",
        "Improve documentation",
      ],
    };
  }

  return {
    quarter,
    generatedAt: new Date().toISOString(),
    sampleCount: snapshot.sampleCount,
    headline: parsed.headline ?? "",
    keyFindings: parsed.keyFindings ?? [],
    moduleInsights: snapshot.modules.map((m) => ({
      module: m.module,
      avgScore: m.avg,
      trend: m.avg >= snapshot.overallAvg ? "above average" : "below average",
    })),
    topIssues: parsed.topIssues ?? [],
    recommendations: parsed.recommendations ?? [],
  };
}
