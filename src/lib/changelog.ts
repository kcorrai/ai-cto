export type ChangelogEntry = {
  date: string; // ISO date string
  title: string;
  description: string;
  category: "feature" | "improvement" | "fix";
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-13",
    title: "Social Sharing & Share Modal",
    description:
      "Share your SaaS Score directly to Twitter/X and LinkedIn with a pre-written message. Access via the 'Share' button on any analysis report.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "Framework Best Practices Pages",
    description:
      "SEO-optimized pages aggregating common issues by framework: Next.js, Django, Rails, FastAPI, Express, Laravel, NestJS, SvelteKit, Vue/Nuxt, and Spring Boot.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "REST API v1 & API Key Management",
    description:
      "Pro+ users can now access all project and analysis data programmatically. Create API keys in Settings → API Keys. Full documentation at /docs/api.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "Affiliate & Referral Program",
    description:
      "Every user now has a unique referral link. Referred users get a 30-day free Pro trial; you earn $10 credit on their first conversion. Find your link in Settings.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "GitHub App Support",
    description:
      "AI CTO now supports GitHub App installation alongside the existing OAuth flow. GitHub App provides higher API rate limits (15,000 req/hr) and a better security model.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "Auto-Analyze on Push",
    description:
      "Pro+ users can enable automatic re-analysis when new code is pushed to the tracked branch. Configurable per project in the Overview page. Rate-limited to one analysis per 24 hours.",
    category: "feature",
  },
  {
    date: "2026-06-13",
    title: "Public SaaS Score Leaderboard",
    description:
      "Browse and compare SaaS Scores for popular open-source projects at /leaderboard. Submit your own public repository for community analysis.",
    category: "feature",
  },
  {
    date: "2026-06-12",
    title: "README Badge",
    description:
      "Embed a live SaaS Score badge in your GitHub README. Three styles available: flat, flat-square, and for-the-badge. Copy Markdown or HTML from the project Overview.",
    category: "feature",
  },
  {
    date: "2026-06-12",
    title: "Linear Integration",
    description:
      "Push findings directly to Linear as issues. Severity is mapped to Linear priority. Connect via Settings → Linear Integration.",
    category: "feature",
  },
  {
    date: "2026-06-12",
    title: "Analysis History & Score Trends",
    description:
      "View all past analyses and track your SaaS Score over time with the new History and Trend views under each project.",
    category: "feature",
  },
  {
    date: "2026-06-11",
    title: "AI Advisor Chat",
    description:
      "Ask your AI CTO questions about the analysis in natural language. The advisor has full context of your findings and can suggest specific fixes.",
    category: "feature",
  },
];
