import { createYoga, createSchema } from "graphql-yoga";
import { authenticateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db";

const typeDefs = /* GraphQL */ `
  type Query {
    projects(first: Int, after: String): ProjectConnection!
    project(id: ID!): Project
    analyses(projectId: ID!, first: Int, after: String): AnalysisConnection!
    analysis(id: ID!): Analysis
    findings(analysisId: ID!, severity: String, isResolved: Boolean): [Finding!]!
    conversations(projectId: ID): [Conversation!]!
  }

  type Mutation {
    triggerAnalysis(projectId: ID!): TriggerResult!
    resolveFindings(findingIds: [ID!]!): BulkResult!
    createProject(name: String!, githubOwner: String!, githubRepo: String!): Project!
  }

  type ProjectConnection {
    edges: [ProjectEdge!]!
    pageInfo: PageInfo!
  }

  type ProjectEdge {
    node: Project!
    cursor: String!
  }

  type AnalysisConnection {
    edges: [AnalysisEdge!]!
    pageInfo: PageInfo!
  }

  type AnalysisEdge {
    node: Analysis!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Project {
    id: ID!
    name: String!
    slug: String!
    githubOwner: String
    githubRepo: String
    githubUrl: String
    language: String
    framework: String
    latestScore: Int
    analysisCount: Int!
    lastAnalyzedAt: String
    createdAt: String!
    latestAnalysis: Analysis
  }

  type Analysis {
    id: ID!
    status: String!
    score: Int
    summary: String
    completedAt: String
    createdAt: String!
    modules: [ModuleResult!]!
    findingCount: Int!
  }

  type ModuleResult {
    module: String!
    status: String!
    score: Int
  }

  type Finding {
    id: ID!
    module: String!
    severity: String!
    title: String!
    description: String
    recommendation: String
    filePath: String
    effort: String
    isResolved: Boolean!
    isRegression: Boolean!
    createdAt: String!
  }

  type Conversation {
    id: ID!
    title: String
    projectId: ID
    createdAt: String!
    messageCount: Int!
  }

  type TriggerResult {
    analysisId: String!
    status: String!
  }

  type BulkResult {
    count: Int!
  }
`;

type GQLContext = { userId: string; scopes: string[] };

const schema = createSchema<GQLContext>({
  typeDefs,
  resolvers: {
    Query: {
      async projects(_: unknown, args: { first?: number; after?: string }, ctx: GQLContext) {
        const limit = Math.min(args.first ?? 20, 100);
        const projects = await db.project.findMany({
          where: { userId: ctx.userId, status: { not: "deleted" } },
          select: {
            id: true,
            name: true,
            slug: true,
            githubOwner: true,
            githubRepo: true,
            githubUrl: true,
            language: true,
            framework: true,
            latestScore: true,
            analysisCount: true,
            lastAnalyzedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          ...(args.after ? { cursor: { id: args.after }, skip: 1 } : {}),
        });
        const hasNextPage = projects.length > limit;
        const items = hasNextPage ? projects.slice(0, limit) : projects;
        return {
          edges: items.map((p) => ({
            node: {
              ...p,
              lastAnalyzedAt: p.lastAnalyzedAt?.toISOString() ?? null,
              createdAt: p.createdAt.toISOString(),
            },
            cursor: p.id,
          })),
          pageInfo: { hasNextPage, endCursor: items[items.length - 1]?.id ?? null },
        };
      },

      async project(_: unknown, args: { id: string }, ctx: GQLContext) {
        return db.project.findFirst({
          where: { id: args.id, userId: ctx.userId, status: { not: "deleted" } },
          select: {
            id: true,
            name: true,
            slug: true,
            githubOwner: true,
            githubRepo: true,
            githubUrl: true,
            language: true,
            framework: true,
            latestScore: true,
            analysisCount: true,
            lastAnalyzedAt: true,
            createdAt: true,
          },
        });
      },

      async analyses(
        _: unknown,
        args: { projectId: string; first?: number; after?: string },
        ctx: GQLContext
      ) {
        const project = await db.project.findFirst({
          where: { id: args.projectId, userId: ctx.userId },
          select: { id: true },
        });
        if (!project) return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
        const limit = Math.min(args.first ?? 20, 100);
        const items = await db.analysis.findMany({
          where: { projectId: project.id },
          select: {
            id: true,
            status: true,
            score: true,
            summary: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          ...(args.after ? { cursor: { id: args.after }, skip: 1 } : {}),
        });
        const hasNextPage = items.length > limit;
        const edges = (hasNextPage ? items.slice(0, limit) : items).map((a) => ({
          node: {
            ...a,
            completedAt: a.completedAt?.toISOString() ?? null,
            createdAt: a.createdAt.toISOString(),
          },
          cursor: a.id,
        }));
        return {
          edges,
          pageInfo: { hasNextPage, endCursor: edges[edges.length - 1]?.cursor ?? null },
        };
      },

      async analysis(_: unknown, args: { id: string }, ctx: GQLContext) {
        const a = await db.analysis.findFirst({
          where: { id: args.id, project: { userId: ctx.userId } },
          select: {
            id: true,
            status: true,
            score: true,
            summary: true,
            completedAt: true,
            createdAt: true,
          },
        });
        return a
          ? {
              ...a,
              completedAt: a.completedAt?.toISOString() ?? null,
              createdAt: a.createdAt.toISOString(),
            }
          : null;
      },

      async findings(
        _: unknown,
        args: { analysisId: string; severity?: string; isResolved?: boolean },
        ctx: GQLContext
      ) {
        const a = await db.analysis.findFirst({
          where: { id: args.analysisId, project: { userId: ctx.userId } },
          select: { id: true },
        });
        if (!a) return [];
        return db.finding
          .findMany({
            where: {
              analysisId: a.id,
              ...(args.severity ? { severity: args.severity as never } : {}),
              ...(args.isResolved !== undefined ? { isResolved: args.isResolved } : {}),
            },
            select: {
              id: true,
              module: true,
              severity: true,
              title: true,
              description: true,
              recommendation: true,
              filePath: true,
              effort: true,
              isResolved: true,
              isRegression: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
          .then((rows) => rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
      },

      async conversations(_: unknown, args: { projectId?: string }, ctx: GQLContext) {
        return db.advisorConversation
          .findMany({
            where: { userId: ctx.userId, ...(args.projectId ? { projectId: args.projectId } : {}) },
            select: {
              id: true,
              title: true,
              projectId: true,
              createdAt: true,
              _count: { select: { messages: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: r.id,
              title: r.title,
              projectId: r.projectId,
              createdAt: r.createdAt.toISOString(),
              messageCount: r._count.messages,
            }))
          );
      },
    },

    Mutation: {
      async triggerAnalysis(_: unknown, args: { projectId: string }, ctx: GQLContext) {
        if (!ctx.scopes.includes("write")) throw new Error("write scope required");
        const { triggerAnalysis } = await import("@/lib/queue/analysis");
        const analysisId = await triggerAnalysis(args.projectId, ctx.userId, "manual");
        return { analysisId, status: "queued" };
      },

      async resolveFindings(_: unknown, args: { findingIds: string[] }, ctx: GQLContext) {
        if (!ctx.scopes.includes("write")) throw new Error("write scope required");
        const result = await db.finding.updateMany({
          where: { id: { in: args.findingIds }, project: { userId: ctx.userId } },
          data: { isResolved: true, resolvedAt: new Date() },
        });
        return { count: result.count };
      },

      async createProject(
        _: unknown,
        args: { name: string; githubOwner: string; githubRepo: string },
        ctx: GQLContext
      ) {
        if (!ctx.scopes.includes("write")) throw new Error("write scope required");
        const user = await db.user.findUnique({ where: { id: ctx.userId }, select: { id: true } });
        if (!user) throw new Error("User not found");
        const slug = `${args.githubOwner}-${args.githubRepo}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");
        return db.project
          .create({
            data: {
              userId: ctx.userId,
              name: args.name,
              slug,
              githubOwner: args.githubOwner,
              githubRepo: args.githubRepo,
              githubUrl: `https://github.com/${args.githubOwner}/${args.githubRepo}`,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              githubOwner: true,
              githubRepo: true,
              githubUrl: true,
              language: true,
              framework: true,
              latestScore: true,
              analysisCount: true,
              lastAnalyzedAt: true,
              createdAt: true,
            },
          })
          .then((p) => ({
            ...p,
            lastAnalyzedAt: p.lastAnalyzedAt?.toISOString() ?? null,
            createdAt: p.createdAt.toISOString(),
          }));
      },
    },

    Project: {
      async latestAnalysis(parent: { id: string }) {
        const a = await db.analysis.findFirst({
          where: { projectId: parent.id, status: "complete" },
          select: {
            id: true,
            status: true,
            score: true,
            summary: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        return a
          ? {
              ...a,
              completedAt: a.completedAt?.toISOString() ?? null,
              createdAt: a.createdAt.toISOString(),
            }
          : null;
      },
    },

    Analysis: {
      async modules(parent: { id: string }) {
        return db.analysisModule
          .findMany({
            where: { analysisId: parent.id },
            select: { module: true, status: true, score: true },
          })
          .then((rows) =>
            rows.map((r) => ({ module: r.module, status: r.status, score: r.score }))
          );
      },
      async findingCount(parent: { id: string }) {
        return db.finding.count({ where: { analysisId: parent.id } });
      },
    },
  },
});

const { handleRequest } = createYoga<{ request: Request }>({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response, Request, ReadableStream },
  context: async ({ request }) => {
    const apiUser = await authenticateApiKey(request as Request);
    if (!apiUser) throw new Error("Unauthorized");
    return { userId: apiUser.userId, scopes: apiUser.scopes };
  },
});

export async function GET(request: Request) {
  return handleRequest(request, { request });
}

export async function POST(request: Request) {
  return handleRequest(request, { request });
}
