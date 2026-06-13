import { env } from "@/env";

const spec = (baseUrl: string) => ({
  openapi: "3.1.0",
  info: {
    title: "AI CTO API",
    version: "1.0.0",
    description:
      "Programmatically manage projects, trigger analyses, and retrieve findings. Requires a Pro plan and an API key from Settings → API Keys.",
  },
  servers: [{ url: `${baseUrl}/api`, description: "Production" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key prefixed with `aicto_live_`",
      },
    },
    schemas: {
      Envelope: {
        type: "object",
        properties: {
          data: { nullable: true },
          meta: { type: "object", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          githubOwner: { type: "string", nullable: true },
          githubRepo: { type: "string", nullable: true },
          githubUrl: { type: "string", nullable: true },
          language: { type: "string", nullable: true },
          framework: { type: "string", nullable: true },
          latestScore: { type: "integer", nullable: true, minimum: 0, maximum: 100 },
          analysisCount: { type: "integer" },
          lastAnalyzedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Analysis: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["queued", "fetching", "analyzing", "synthesizing", "complete", "failed"],
          },
          score: { type: "integer", nullable: true, minimum: 0, maximum: 100 },
          summary: { type: "string", nullable: true },
          trigger: { type: "string" },
          durationMs: { type: "integer", nullable: true },
          tokenCount: { type: "integer", nullable: true },
          isPublic: { type: "boolean" },
          publicToken: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Finding: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low", "info"],
          },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          recommendation: { type: "string", nullable: true },
          filePath: { type: "string", nullable: true },
          module: { type: "string" },
          isResolved: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/v1/projects": {
      get: {
        summary: "List projects",
        operationId: "listProjects",
        tags: ["Projects"],
        parameters: [
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
            description: "Pagination cursor",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, maximum: 100 },
            description: "Page size",
          },
        ],
        responses: {
          "200": {
            description: "List of projects",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Envelope" } } },
          },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Create a project",
        operationId: "createProject",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["githubOwner", "githubRepo"],
                properties: {
                  githubOwner: { type: "string" },
                  githubRepo: { type: "string" },
                  githubBranch: { type: "string", default: "main" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Project created" },
          "401": { description: "Unauthorized" },
          "403": { description: "Write scope required" },
          "409": { description: "Project already exists" },
        },
      },
    },
    "/v1/projects/{id}": {
      get: {
        summary: "Get a project",
        operationId: "getProject",
        tags: ["Projects"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Project details" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/v1/projects/{id}/score": {
      get: {
        summary: "Get current score",
        operationId: "getProjectScore",
        tags: ["Projects"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Score and last analysis timestamp" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/v1/projects/{id}/analyses": {
      get: {
        summary: "List analyses",
        operationId: "listAnalyses",
        tags: ["Analyses"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "List of analyses" },
          "401": { description: "Unauthorized" },
          "404": { description: "Project not found" },
        },
      },
      post: {
        summary: "Trigger an analysis",
        operationId: "triggerAnalysis",
        tags: ["Analyses"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "202": { description: "Analysis queued" },
          "401": { description: "Unauthorized" },
          "403": { description: "Write scope required or plan limit reached" },
          "404": { description: "Project not found" },
          "409": { description: "Analysis already running" },
        },
      },
    },
    "/v1/analyses/{id}": {
      get: {
        summary: "Get an analysis",
        operationId: "getAnalysis",
        tags: ["Analyses"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Analysis details with module breakdown" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
    },
    "/v1/analyses/{id}/findings": {
      get: {
        summary: "Get findings",
        operationId: "getFindings",
        tags: ["Analyses"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          {
            name: "severity",
            in: "query",
            schema: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
        ],
        responses: {
          "200": { description: "List of findings" },
          "401": { description: "Unauthorized" },
          "404": { description: "Analysis not found" },
        },
      },
    },
  },
});

export function GET() {
  return new Response(JSON.stringify(spec(env.NEXT_PUBLIC_APP_URL), null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
