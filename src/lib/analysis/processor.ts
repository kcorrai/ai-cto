import type { ModuleName, Severity, Effort } from "@prisma/client";
import { db } from "@/lib/db";
import { fetchRepository, type RepoBundle } from "@/lib/github/fetcher";
import { releaseLock, type AnalysisJobPayload } from "@/lib/analysis/shared";
import { generateText } from "ai";
import { AI_MODEL } from "@/lib/ai/gateway";
import { runArchitectureModule } from "@/lib/ai/modules/architecture";
import { runCodeQualityModule } from "@/lib/ai/modules/code-quality";
import { runSecurityModule } from "@/lib/ai/modules/security";
import { runDependenciesModule } from "@/lib/ai/modules/dependencies";
import { runProductReadinessModule } from "@/lib/ai/modules/product-readiness";
import { runPerformanceModule } from "@/lib/ai/modules/performance";
import { runTestingModule } from "@/lib/ai/modules/testing";
import { runDocumentationModule } from "@/lib/ai/modules/documentation";
import { runApiDesignModule } from "@/lib/ai/modules/api-design";
import { runDatabaseModule } from "@/lib/ai/modules/database";
import { runDevOpsModule } from "@/lib/ai/modules/devops";
import { runSaasMaturityModule } from "@/lib/ai/modules/saas-maturity";
import { runProductManagerModule } from "@/lib/ai/modules/product-manager";
import { runMarketIntelligenceModule } from "@/lib/ai/modules/market-intelligence";
import { runTeamAdvisorModule } from "@/lib/ai/modules/team-advisor";
import { runSecurityOwaspModule } from "@/lib/ai/modules/security-owasp";
import { calculateSaaSScore } from "@/lib/scoring/saas-score";
import { generateExecutiveSummary } from "@/lib/ai/synthesis";
import type { CriticalFinding } from "@/lib/ai/synthesis";
import { sendEmail } from "@/lib/email";
import { AnalysisCompleteEmail } from "@/emails/AnalysisCompleteEmail";
import { AnalysisFailedEmail } from "@/emails/AnalysisFailedEmail";
import { sendSlackMessage, analysisCompleteBlocks, criticalFindingBlocks } from "@/lib/slack";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { env } from "@/env";

// Run tasks with a max concurrency limit using a worker-pool pattern.
async function pooled<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: Array<R | undefined> = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results as R[];
}

const MODULE_CONCURRENCY = 4;

type RawCustomFinding = {
  severity?: string;
  title?: string;
  description?: string;
  recommendation?: string;
  filePath?: string;
};

async function runCustomModule(
  moduleId: string,
  moduleName: string,
  prompt: string,
  bundle: RepoBundle
): Promise<RawCustomFinding[]> {
  const filesSummary = bundle.files
    .slice(0, 30)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 500)}`)
    .join("\n\n");

  const userPrompt = `${prompt}\n\nRepository: ${bundle.repoMetadata.fullName}\nLanguage: ${bundle.repoMetadata.language ?? "unknown"}\n\nFiles (sample):\n${filesSummary}\n\nReturn a JSON array of findings. Each finding must have: severity (critical|high|medium|low|info), title (string), description (string), recommendation (string). Optional: filePath (string).`;

  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system:
        "You are a code analysis expert. Analyze the provided repository and return findings as a JSON array. Output ONLY valid JSON, no explanation.",
      prompt: userPrompt,
      maxOutputTokens: 2000,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    return parsed.filter(
      (f): f is RawCustomFinding =>
        typeof f === "object" && f !== null && "title" in f && "severity" in f
    );
  } catch {
    console.error(`Custom module ${moduleId} (${moduleName}) failed`);
    return [];
  }
}

const MODULES: Array<{ name: ModuleName; run: (b: RepoBundle) => Promise<{ score: number }> }> = [
  { name: "architecture", run: runArchitectureModule },
  { name: "code_quality", run: runCodeQualityModule },
  { name: "security", run: runSecurityModule },
  { name: "performance", run: runPerformanceModule },
  { name: "testing", run: runTestingModule },
  { name: "documentation", run: runDocumentationModule },
  { name: "api_design", run: runApiDesignModule },
  { name: "database", run: runDatabaseModule },
  { name: "devops", run: runDevOpsModule },
  { name: "saas_maturity", run: runSaasMaturityModule },
  { name: "dependencies", run: runDependenciesModule },
  { name: "product_readiness", run: runProductReadinessModule },
  { name: "product_manager", run: runProductManagerModule },
  { name: "market_intelligence", run: runMarketIntelligenceModule },
  { name: "team_advisor", run: runTeamAdvisorModule },
  { name: "security_owasp", run: runSecurityOwaspModule },
];

export async function processAnalysis(message: AnalysisJobPayload): Promise<void> {
  const { analysisId, projectId, userId, modules: enabledModules } = message;

  const current = await db.analysis.findUnique({
    where: { id: analysisId },
    select: { status: true },
  });
  if (!current) return;
  if (
    current.status === "complete" ||
    current.status === "fetching" ||
    current.status === "analyzing" ||
    current.status === "synthesizing"
  ) {
    return;
  }

  try {
    await db.analysis.update({
      where: { id: analysisId },
      data: { status: "fetching", progress: 5 },
    });
    const bundle = await fetchRepository(projectId, userId, analysisId);

    await db.analysis.update({
      where: { id: analysisId },
      data: { status: "analyzing", progress: 20 },
    });
    const allowedSet = new Set(enabledModules ?? MODULES.map((m) => m.name as string));
    const activeModules = MODULES.filter((m) => allowedSet.has(m.name as string));

    let completedCount = 0;
    const totalModules = activeModules.length;
    const rawResults = await pooled(activeModules, MODULE_CONCURRENCY, async ({ name, run }) => {
      const result = await run(bundle);
      completedCount++;
      const progress = Math.round(20 + (completedCount / totalModules) * 60);
      await db.analysis.update({ where: { id: analysisId }, data: { progress } }).catch(() => null);
      return { name, score: result.score };
    });

    // Run custom modules (enterprise orgs only)
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });
    const customFindings: Array<{
      analysisId: string;
      projectId: string;
      module: string;
      severity: Severity;
      title: string;
      description: string | null;
      recommendation: string | null;
      filePath: string | null;
      effort: Effort | null;
      impact: Effort | null;
    }> = [];
    if (project?.organizationId) {
      const customModules = await db.customModule.findMany({
        where: { organizationId: project.organizationId, enabled: true },
      });
      for (const cm of customModules) {
        const findings = await runCustomModule(cm.id, cm.name, cm.prompt, bundle);
        for (const f of findings) {
          if (!f.title || !f.severity) continue;
          const validSeverities: Severity[] = ["critical", "high", "medium", "low", "info"];
          const severity = validSeverities.includes(f.severity as Severity)
            ? (f.severity as Severity)
            : "info";
          customFindings.push({
            analysisId,
            projectId,
            module: `custom:${cm.name}`,
            severity,
            title: f.title,
            description: f.description ?? null,
            recommendation: f.recommendation ?? null,
            filePath: f.filePath ?? null,
            effort: null,
            impact: null,
          });
        }
      }
    }

    await db.analysis.update({
      where: { id: analysisId },
      data: { status: "synthesizing", progress: 85 },
    });
    const moduleScores = Object.fromEntries(
      rawResults.map(({ name, score }) => [name, score])
    ) as Partial<Record<ModuleName, number>>;
    const { score, label, breakdown } = calculateSaaSScore(moduleScores);

    const moduleRecords = await db.analysisModule.findMany({
      where: { analysisId, status: "complete" },
      select: { module: true, findings: true },
    });
    type RawFinding = {
      severity: string;
      title: string;
      description?: string;
      recommendation?: string;
      filePath?: string;
      effort?: string;
      impact?: string;
    };

    // Build a quick lookup for code snippet extraction
    const fileContentMap = new Map(bundle.files.map((f) => [f.path, f.content]));
    function extractSnippet(filePath: string): string | null {
      const content = fileContentMap.get(filePath);
      if (!content) return null;
      const lines = content.split("\n");
      return lines.slice(0, 60).join("\n");
    }

    const findingInserts = [
      ...moduleRecords.flatMap((m) =>
        (m.findings as RawFinding[]).map((f) => {
          const snippet = f.filePath ? extractSnippet(f.filePath) : null;
          return {
            analysisId,
            projectId,
            module: m.module as string,
            severity: f.severity as Severity,
            title: f.title,
            description: f.description ?? null,
            recommendation: f.recommendation ?? null,
            filePath: f.filePath ?? null,
            effort: (f.effort as Effort | undefined) ?? null,
            impact: (f.impact as Effort | undefined) ?? null,

            ...(snippet ? { metadata: { codeSnippet: snippet } as never } : {}),
          };
        })
      ),
      ...customFindings,
    ];
    // Deduplicate findings across modules: same filePath + similar title → keep the highest-severity one
    const severityRank: Record<string, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };
    function dedupeKey(f: { filePath: string | null; title: string }): string {
      const normalizedTitle = f.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
      return `${f.filePath ?? ""}::${normalizedTitle}`;
    }
    const dedupedMap = new Map<string, (typeof findingInserts)[number]>();
    for (const f of findingInserts) {
      const key = dedupeKey(f);
      const existing = dedupedMap.get(key);
      if (!existing || (severityRank[f.severity] ?? 0) > (severityRank[existing.severity] ?? 0)) {
        dedupedMap.set(key, f);
      }
    }
    const dedupedInserts = [...dedupedMap.values()];

    // Regression detection: check if any new finding matches a previously resolved finding
    const resolvedFindings = await db.finding.findMany({
      where: { projectId, isResolved: true },
      select: { id: true, title: true, filePath: true, severity: true, resolvedAt: true },
    });
    const resolvedKeyMap = new Map(
      resolvedFindings.map((f) => [dedupeKey({ filePath: f.filePath, title: f.title }), f])
    );

    const insertsWithRegression = dedupedInserts.map((f) => {
      const resolvedMatch = resolvedKeyMap.get(dedupeKey({ filePath: f.filePath, title: f.title }));
      return {
        ...f,
        isRegression: !!resolvedMatch,
        regressionOf: resolvedMatch?.id ?? null,
      };
    });

    const regressionCount = insertsWithRegression.filter((f) => f.isRegression).length;

    await db.$transaction(async (tx) => {
      await tx.finding.deleteMany({ where: { analysisId } });
      if (insertsWithRegression.length > 0) {
        await tx.finding.createMany({ data: insertsWithRegression });
      }
    });

    const topFindings: CriticalFinding[] = moduleRecords
      .flatMap((m) => {
        const findings = m.findings as RawFinding[];
        return findings
          .filter((f) => f.severity === "critical" || f.severity === "high")
          .map(
            (f): CriticalFinding => ({
              severity: f.severity,
              title: f.title,
              recommendation: f.recommendation ?? "",
              module: m.module as string,
              ...(f.filePath ? { filePath: f.filePath } : {}),
            })
          );
      })
      .slice(0, 5);

    const summary = await generateExecutiveSummary({
      projectName: bundle.repoMetadata.fullName,
      score,
      label,
      moduleScores: breakdown,
      topFindings,
    });

    // Aggregate cost tracking from all module token counts
    const moduleTokenCounts = await db.analysisModule.findMany({
      where: { analysisId },
      select: { tokenCount: true, durationMs: true },
    });
    const totalModuleTokens = moduleTokenCounts.reduce((sum, m) => sum + (m.tokenCount ?? 0), 0);
    const totalDurationMs = moduleTokenCounts.reduce((sum, m) => sum + (m.durationMs ?? 0), 0);
    // Approximate cost: modules use claude-sonnet-4-6 ($3/M input + $15/M output),
    // synthesis uses claude-opus-4-8 ($15/M input + $75/M output)
    // We store token counts without input/output split, so we use blended estimate
    const MODULE_COST_PER_TOKEN = 0.000009; // ~$9/M blended for sonnet
    const SYNTHESIS_COST_PER_TOKEN = 0.000045; // ~$45/M blended for opus
    const synthesisTokens = (summary.length / 4) * 2; // rough estimate: summary output + ~equal input
    const estimatedCostUsd = (
      totalModuleTokens * MODULE_COST_PER_TOKEN +
      synthesisTokens * SYNTHESIS_COST_PER_TOKEN
    ).toFixed(4);

    await db.analysis.update({
      where: { id: analysisId },
      data: {
        status: "complete",
        progress: 100,
        score,
        scoreBreakdown: { label, ...breakdown },
        summary,
        tokenCount: totalModuleTokens,
        durationMs: totalDurationMs,
        completedAt: new Date(),
        metadata: {
          costTracking: {
            totalModuleTokens,
            synthesisTokens: Math.round(synthesisTokens),
            estimatedCostUsd,
            totalDurationMs,
          },
        } as never,
      },
    });
    await db.project.update({
      where: { id: projectId },
      data: {
        lastAnalyzedAt: new Date(),
        latestScore: score,
        analysisCount: { increment: 1 },
      },
    });

    const userForEmail = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, settings: true },
    });
    const userSettings = (userForEmail?.settings as Record<string, unknown>) ?? {};
    const emailEnabled = userSettings.emailOnComplete !== false;
    if (userForEmail && emailEnabled) {
      const reportUrl = `${env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/analysis`;
      const topFindingsForEmail = insertsWithRegression
        .filter((f) => f.severity === "critical" || f.severity === "high")
        .slice(0, 3)
        .map((f) => ({ title: f.title, severity: f.severity as string }));
      void sendEmail({
        to: userForEmail.email,
        subject: `Your ${bundle.repoMetadata.fullName} analysis is ready — Score: ${score}/100`,
        react: AnalysisCompleteEmail({
          name: userForEmail.name ?? userForEmail.email,
          projectName: bundle.repoMetadata.fullName,
          score,
          label,
          topFindings: topFindingsForEmail,
          reportUrl,
          appUrl: env.NEXT_PUBLIC_APP_URL,
        }),
      });
    }
    // Regression alert email (fire-and-forget)
    if (regressionCount > 0 && userForEmail) {
      const reportUrl = `${env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/analysis`;
      const regressionTitles = insertsWithRegression
        .filter((f) => f.isRegression)
        .slice(0, 3)
        .map((f) => f.title);
      void sendEmail({
        to: userForEmail.email,
        subject: `Regression detected in ${bundle.repoMetadata.fullName} — ${regressionCount} resolved issue${regressionCount > 1 ? "s" : ""} reappeared`,
        react: AnalysisCompleteEmail({
          name: userForEmail.name ?? userForEmail.email,
          projectName: bundle.repoMetadata.fullName,
          score,
          label,
          topFindings: regressionTitles.map((t) => ({
            title: `[REGRESSION] ${t}`,
            severity: "high",
          })),
          reportUrl,
          appUrl: env.NEXT_PUBLIC_APP_URL,
        }),
      });
    }
    // Slack notification (fire-and-forget)
    const projectWithOrg = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true, organization: { select: { slackConfig: true } } },
    });
    if (projectWithOrg?.organizationId) {
      const slackCfg = projectWithOrg.organization?.slackConfig as Record<string, boolean> | null;
      const reportUrl = `${env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/analysis`;
      if (slackCfg?.analysis_complete !== false) {
        void sendSlackMessage({
          orgId: projectWithOrg.organizationId,
          fallbackText: `Analysis complete: ${bundle.repoMetadata.fullName} — Score: ${score}/100`,
          blocks: analysisCompleteBlocks({
            projectName: bundle.repoMetadata.fullName,
            score,
            summary: summary.slice(0, 200),
            url: reportUrl,
          }),
        });
      }
      const hasCritical = insertsWithRegression.some((f) => f.severity === "critical");
      if (hasCritical && slackCfg?.critical_finding !== false) {
        const critFinding = insertsWithRegression.find((f) => f.severity === "critical");
        if (critFinding) {
          void sendSlackMessage({
            orgId: projectWithOrg.organizationId,
            fallbackText: `Critical finding: ${critFinding.title}`,
            blocks: criticalFindingBlocks({
              projectName: bundle.repoMetadata.fullName,
              findingTitle: critFinding.title,
              url: reportUrl,
            }),
          });
        }
      }
      // Outbound webhooks
      void dispatchWebhookEvent({
        organizationId: projectWithOrg.organizationId,
        event: "analysis_complete",
        data: {
          analysisId,
          projectId,
          projectName: bundle.repoMetadata.fullName,
          score,
          label,
        },
      });
    }
  } catch (error) {
    await db.analysis.update({
      where: { id: analysisId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    const userForFailEmail = await db.user
      .findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .catch(() => null);
    if (userForFailEmail) {
      const project = await db.project
        .findUnique({ where: { id: projectId }, select: { githubOwner: true, githubRepo: true } })
        .catch(() => null);
      const projectName = project ? `${project.githubOwner}/${project.githubRepo}` : "your project";
      void sendEmail({
        to: userForFailEmail.email,
        subject: `Analysis failed for ${projectName}`,
        react: AnalysisFailedEmail({
          name: userForFailEmail.name ?? userForFailEmail.email,
          projectName,
          retryUrl: `${env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/overview`,
        }),
      });
    }

    throw error;
  } finally {
    await releaseLock(projectId);
  }
}
