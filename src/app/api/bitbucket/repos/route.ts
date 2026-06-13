import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

type UserSettings = {
  bitbucketAccessToken?: string;
  bitbucketUsername?: string;
  [key: string]: unknown;
};

type BbRepo = {
  uuid: string;
  full_name: string;
  description: string;
  is_private: boolean;
  updated_on: string;
  mainbranch?: { name: string };
  links: { html: { href: string } };
  owner: { nickname: string };
  language: string;
};

type BbResponse = {
  values: BbRepo[];
  next?: string;
  size?: number;
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { settings: true },
  });

  const settings = (user?.settings ?? {}) as UserSettings;
  if (!settings.bitbucketAccessToken) {
    return NextResponse.json({ error: "Bitbucket not connected" }, { status: 400 });
  }

  const token = decrypt(settings.bitbucketAccessToken);
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const search = url.searchParams.get("search") ?? "";

  const params = new URLSearchParams({
    role: "member",
    pagelen: "30",
    page: String(page),
    sort: "-updated_on",
    ...(search ? { q: `name ~ "${search}"` } : {}),
  });

  const res = await fetch(`https://api.bitbucket.org/2.0/repositories?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch Bitbucket repositories" }, { status: 502 });
  }

  const data = (await res.json()) as BbResponse;

  return NextResponse.json({
    repos: data.values.map((r) => ({
      fullName: r.full_name,
      description: r.description,
      isPrivate: r.is_private,
      lastActivity: r.updated_on,
      defaultBranch: r.mainbranch?.name ?? "main",
      htmlUrl: r.links.html.href,
      owner: r.owner.nickname,
      language: r.language,
    })),
    hasNext: !!data.next,
    page,
  });
}
