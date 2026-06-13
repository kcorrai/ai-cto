import { NextRequest, NextResponse } from "next/server";
import { resolveWhiteLabelByHostname } from "@/lib/white-label/resolver";

// Public endpoint — resolves white-label branding by host header.
// Called by edge/CDN or client to get branding for a custom domain.
export async function GET(req: NextRequest) {
  const host =
    req.nextUrl.searchParams.get("host") ??
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "";

  if (!host) return NextResponse.json({ branding: null });

  const branding = await resolveWhiteLabelByHostname(host);
  return NextResponse.json(
    { branding },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    }
  );
}
