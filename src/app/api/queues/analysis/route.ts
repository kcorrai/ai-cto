import { handleCallback } from "@vercel/queue";
import type { ModuleName, Severity, Effort } from "@prisma/client";
import { db } from "@/lib/db";
import { fetchRepository, type RepoBundle } from "@/lib/github/fetcher";
import { releaseLock, type AnalysisJobPayload } from "@/lib/queue/analysis";
import { runArchitectureModule } from "@/lib/ai/modules/architecture";
import { runCodeQualityModule } from "@/lib/ai/modules/code-quality";
import { runSecurityModule } from "@/lib/ai/modules/security";
import { runDependenciesModule } from "@/lib/ai/modules/dependencies";
import { runProductReadinessModule } from "@/lib/ai/modules/product-readiness";
import { calculateSaaSScore } from "@/lib/scoring/saas-score";
import { generateExecutiveSummary } from "@/lib/ai/synthesis";
import type { CriticalFinding } from "@/lib/ai/synthesis";
import { sendEmail } from "@/lib/email";
import { AnalysisCompleteEmail } from "@/emails/AnalysisCompleteEmail";
import { AnalysisFailedEmail } from "@/emails/AnalysisFailedEmail";
import { env } from "@/env";

// Each entry pairs a Prisma ModuleName with its runner function
const MODULES: Array<{ name: ModuleName; run: (b: RepoBundle) => Promise<{ score: number }> }> = [
  { name: "architecture", run: runArchitectureModule }, // TASK-012
  { name: "code_quality", run: runCodeQualityModule }, // TASK-013
  { name: "security", run: runSecurityModule }, // TASK-014
  { name: "dependencies", run: runDependenciesModule }, // TASK-015
  { name: "product_readiness", run: runProductReadinessModule }, // TASK-016
];

export const POST = handleCallback(
  async (message: AnalysisJobPayload) => {
    const { analysisId, projectId, userId, modules: enabledModules } = message;

    // Idempotency: skip if already running or complete (duplicate delivery)
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
      // Stage 1: fetch repository into blob
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: "fetching", progress: 5 },
      });
      const bundle = await fetchRepository(projectId, userId, analysisId);

      // Stage 2: run analysis modules in parallel
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: "analyzing", progress: 20 },
      });
      // Filter to only the modules this user's plan allows
      const allowedSet = new Set(enabledModules ?? MODULES.map((m) => m.name as string));
      const activeModules = MODULES.filter((m) => allowedSet.has(m.name as string));

      const rawResults = await Promise.all(
        activeModules.map(async ({ name, run }) => ({ name, score: (await run(bundle)).score }))
      );

      // Stage 3: compute SaaS Score
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: "synthesizing", progress: 85 },
      });
      const moduleScores = Object.fromEntries(
        rawResults.map(({ name, score }) => [name, score])
      ) as Partial<Record<ModuleName, number>>;
      const { score, label, breakdown } = calculateSaaSScore(moduleScores);

      // Collect top critical/high findings for executive summary
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

      // Persist findings to Finding table (idempotent: delete + recreate)
      const findingInserts = moduleRecords.flatMap((m) =>
        (m.findings as RawFinding[]).map((f) => ({
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
        }))
      );
      await db.$transaction(async (tx) => {
        await tx.finding.deleteMany({ where: { analysisId } });
        if (findingInserts.length > 0) {
          await tx.finding.createMany({ data: findingInserts });
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

      // Stage 4: persist final result
      await db.analysis.update({
        where: { id: analysisId },
        data: {
          status: "complete",
          progress: 100,
          score,
          scoreBreakdown: { label, ...breakdown },
          summary,
          completedAt: new Date(),
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

      // Send analysis complete email if user opted in
      const userForEmail = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, settings: true },
      });
      const userSettings = (userForEmail?.settings as Record<string, unknown>) ?? {};
      const emailEnabled = userSettings.emailOnComplete !== false; // default true
      if (userForEmail && emailEnabled) {
        const reportUrl = `${env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/analysis`;
        const topFindingsForEmail = findingInserts
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
    } catch (error) {
      await db.analysis.update({
        where: { id: analysisId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Notify user of failure
      const userForFailEmail = await db.user
        .findUnique({ where: { id: userId }, select: { email: true, name: true } })
        .catch(() => null);
      if (userForFailEmail) {
        const project = await db.project
          .findUnique({
            where: { id: projectId },
            select: { githubOwner: true, githubRepo: true },
          })
          .catch(() => null);
        const projectName = project
          ? `${project.githubOwner}/${project.githubRepo}`
          : "your project";
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

      throw error; // re-throw so Vercel Queues retries on infrastructure failures
    } finally {
      await releaseLock(projectId);
    }
  },
  {
    visibilityTimeoutSeconds: 600, // matches lock TTL
  }
);
