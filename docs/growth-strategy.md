# Growth Strategy

## Growth Model

AI CTO grows through three compounding loops:

```
Content Loop:
  "AI CTO analyzed X" posts → organic traffic → signups → more analyses → more shareable content

Viral Loop:
  SaaS Score badge → public visibility → developers check their own score → new signups

Word-of-Mouth Loop:
  Founder gets value → tells other founder → new signup → tells another founder
```

---

## Channel 1: Content Marketing (SEO)

### Strategy

Create content that captures high-intent developer/founder search queries. Target keywords with clear commercial intent and relatively low competition.

### Primary Keyword Clusters

**Informational (awareness):**

- "how to do a technical audit saas"
- "code review checklist startup"
- "is my saas launch ready"
- "technical debt in startups"
- "saas architecture review"

**Commercial (consideration):**

- "ai code review tool"
- "automated code audit"
- "saas technical analysis tool"
- "github code analysis ai"
- "technical due diligence tool"

**Branded (retention):**

- "ai cto"
- "saas score"
- "ai cto github"

### Content Types

**1. Public Analysis Case Studies**
"We ran AI CTO on [Popular Open Source Project]. Here's what we found."

- Run analysis on well-known repos (React, Supabase, Tailwind, etc.)
- Write detailed breakdown of the findings
- Share what's impressive and what's missing
- Target: 1 post per week, rank for "[project name] + review/analysis"

**2. Framework Guides**
"The SaaS Technical Checklist Before Launch"
"What Every Next.js SaaS Is Missing"
"The 10 Security Issues Every Solo SaaS Has"

- High-intent, long-tail traffic
- Convert readers by showing AI CTO can find these issues automatically

**3. Comparison Content**
"AI CTO vs. SonarQube: What's the Difference?"
"AI CTO vs. Hiring a Fractional CTO"

- Capture searchers evaluating alternatives

**4. Programmatic SEO**
Generate pages for:

- "SaaS Score for [GitHub repository]" (top 1000 stars repos)
- "AI Analysis: [Framework] projects on GitHub"
- These pages are auto-generated, SEO-optimized, and link to AI CTO

---

## Channel 2: Developer Communities

### IndieHackers

- Maintain active presence, answer technical questions genuinely
- Post bi-weekly updates about building AI CTO itself
- Run AMAs ("I'm building an AI technical advisor for founders")
- Target: 1 quality post/week that provides value

### Hacker News

- Monthly "Show HN" or relevant "Ask HN" participation
- Never spam — only post when you have something genuinely interesting
- The "AI CTO analyzed [famous repo]" format typically performs well

### Twitter/X Developer Community

- Daily presence: share interesting findings from public analyses
- Engage with indie hacker content
- Tweet product updates weekly ("what we shipped this week")
- Target: 1 original post/day, genuine engagement

### Reddit

- r/SaaS — answer questions, never advertise
- r/IndieHackers — share journey posts
- r/webdev — share technical content
- r/programming — case study posts

---

## Channel 3: Product-Led Virality

### SaaS Score Public Badge

README badge that displays the live score:

```markdown
[![AI CTO Score](https://aicto.dev/badge/[projectId])](https://aicto.dev/score/[token])
```

Growth mechanic:

- Pro users get a badge for their project
- Badge is visible in GitHub README
- Developers who see the badge click it to check their own score
- Click → landing page → "Check your score free"

Target: 500 badges installed in 6 months

### Shareable Score Cards

After analysis completes:

- Large "Share your score" CTA
- One-click Twitter/X share with formatted score card image
- "Analyzed by AI CTO" attribution in card
- Target: 20% of completed analyses result in a share

### Public Analysis Pages

For public repos:

- AI CTO hosts a public analysis page (with link attribution)
- Users can share their full analysis publicly if they choose
- Google indexes these pages → organic traffic
- Target: 1,000 public analysis pages in 6 months

### "Show HN-able" Findings

When an analysis finds something genuinely interesting, prompt the user:
"This is a surprising finding. Want to write a post about it?"

- Pre-filled tweet/post template
- Drives word-of-mouth in developer communities

---

## Channel 4: Partnerships and Integrations

### GitHub Marketplace Listing

List AI CTO as a GitHub App:

- Organic discovery from GitHub Explore
- "Used by X repos" social proof
- Direct installation → project creation flow
- Target: 200 installs in 3 months post-listing

### Vercel Marketplace

If eligible, list as an integration:

- Vercel has 500k+ accounts
- Integration auto-provisions and connects to deployed repos
- Native Vercel experience appeals to Next.js SaaS builders

### Linear Integration

"Push to Linear" sends AI CTO findings directly to Linear projects.

- Linear has strong developer community
- Blog post: "How to use AI CTO with Linear to manage technical debt"
- Drives discovery from Linear users searching for integrations

### Developer Tool Bundles

Negotiate bundling with:

- Neon (database for SaaS founders)
- Clerk (auth for SaaS founders)
- Resend (email for SaaS founders)
- Approach: joint "SaaS Starter Stack" promotion

---

## Channel 5: Affiliate Program

### Structure

- 30% recurring commission for 12 months
- Minimum payout: $50
- Cookie duration: 60 days

### Target Affiliates

- Developer/indie hacker newsletter writers
- YouTube developers (tutorials, project builds)
- Twitter developers with 5k+ followers in SaaS/indie space
- Podcast hosts (Indie Hackers, My First Million guests)

### Affiliate Recruitment

1. Identify top 50 potential affiliates
2. Personal outreach (email + Twitter DM)
3. Offer free Pro account + early access to new features
4. Provide ready-made content assets (demo videos, screenshots, copy)

---

## Channel 6: Launch Campaigns

### Product Hunt (Launch Day + Re-launches)

**Initial launch:** Full Product Hunt launch per `launch-plan.md`

**Re-launches:** Every 6 months with a major new feature

- "AI CTO — Now with AI Competitor Analysis"
- "AI CTO — Team collaboration and Linear integration"

### Developer Newsletter Sponsorships

Once MRR is sufficient to support paid acquisition:

| Newsletter           | Audience Size | Estimated CPA |
| -------------------- | ------------- | ------------- |
| JavaScript Weekly    | 200k          | $20-40        |
| Bytes.dev            | 200k          | $25-45        |
| TLDR Newsletter      | 1M            | $30-60        |
| Indie Hackers Weekly | 60k           | $15-30        |

Test one newsletter, measure CPA vs. LTV, scale if positive.

---

## Retention Strategy

### Activation (Day 0)

- Ensure first analysis completes and produces surprising, specific results
- Welcome email with "3 things to do with your first analysis"
- In-app guided tour of key features

### Habit Formation (Week 1–4)

- Weekly digest email (Pro+) with score trend and new suggestions
- Prompt for re-analysis when user pushes significant code changes
- "Congrats! You resolved 5 findings this week" milestone notifications

### Expansion (Month 2+)

- Feature discovery: "You haven't tried the AI Advisor yet. Ask it anything."
- Project limit notifications: "You have 1 more free project slot. Add another?"
- Team invite prompt: "Invite your co-founder to collaborate"

### Churn Prevention

- 7-day email after last activity: "Your [project] hasn't been analyzed in a while"
- Exit survey on cancellation
- Pause subscription option (instead of cancel) for low-frequency users
- Win-back campaign: 3-month post-churn email with new features

---

## Growth Metrics Targets

| Metric                   | Month 3   | Month 6  | Month 12  |
| ------------------------ | --------- | -------- | --------- |
| Organic search traffic   | 1k/month  | 5k/month | 20k/month |
| Referral traffic         | 500/month | 2k/month | 8k/month  |
| Weekly signups           | 50        | 200      | 500       |
| Virality coefficient (K) | 0.1       | 0.2      | 0.3       |
| Badges installed         | 50        | 200      | 500       |
| Public analyses          | 100       | 500      | 2,000     |
| Affiliate revenue share  | 0%        | 5%       | 15%       |
