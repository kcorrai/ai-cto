import { CHANGELOG } from "@/lib/changelog";
import { env } from "@/env";

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const items = CHANGELOG.map(
    (entry) => `
  <item>
    <title><![CDATA[${entry.title}]]></title>
    <description><![CDATA[${entry.description}]]></description>
    <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
    <link>${appUrl}/changelog</link>
    <guid isPermaLink="false">${entry.date}-${entry.title.replace(/\s+/g, "-").toLowerCase()}</guid>
    <category>${entry.category}</category>
  </item>`
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI CTO Changelog</title>
    <description>New features, improvements, and bug fixes in AI CTO.</description>
    <link>${appUrl}/changelog</link>
    <atom:link href="${appUrl}/api/changelog/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
