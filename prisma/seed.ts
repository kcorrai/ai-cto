import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { clerkId: "test_clerk_user_001" },
    update: {},
    create: {
      clerkId: "test_clerk_user_001",
      email: "dev@aicto.dev",
      name: "Dev User",
      plan: "free",
    },
  });

  console.log("Seeded user:", user.id);

  const project = await db.project.upsert({
    where: { userId_slug: { userId: user.id, slug: "test-project" } },
    update: {},
    create: {
      userId: user.id,
      name: "Test Project",
      slug: "test-project",
      type: "github",
      githubOwner: "vercel",
      githubRepo: "next.js",
      githubBranch: "main",
      githubUrl: "https://github.com/vercel/next.js",
      isPrivate: false,
      language: "TypeScript",
    },
  });

  console.log("Seeded project:", project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
