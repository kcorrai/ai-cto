import { db } from "@/lib/db";

const GITHUB_URL_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/)?$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { githubUrl, submitterEmail, message } = body as {
    githubUrl?: string;
    submitterEmail?: string;
    message?: string;
  };

  if (!githubUrl || typeof githubUrl !== "string") {
    return Response.json({ error: "GitHub URL is required" }, { status: 400 });
  }

  if (!GITHUB_URL_RE.test(githubUrl.trim())) {
    return Response.json(
      { error: "Please provide a valid GitHub repository URL" },
      { status: 400 }
    );
  }

  if (submitterEmail && (typeof submitterEmail !== "string" || submitterEmail.length > 255)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  await db.leaderboardSubmission.create({
    data: {
      githubUrl: githubUrl.trim(),
      submitterEmail: submitterEmail?.trim() || null,
      message: message?.trim() || null,
    },
  });

  return Response.json({ success: true }, { status: 201 });
}
