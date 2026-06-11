# Analytics Plan

## Philosophy

Measure what matters for the business. Avoid vanity metrics. Every metric should answer a strategic question.

**Tools:**

- **PostHog** — Product analytics, funnels, session replay, feature flags
- **Vercel Analytics** — Web vitals, page views (privacy-first, zero-config)
- **Stripe Dashboard** — Revenue metrics
- **Custom dashboards** — Business-critical metrics via database queries

---

## North Star Metric

**Weekly Active Analyses (WAA)**
Number of distinct project analyses started per week.

This metric captures the core product value (users getting analyses) and is a leading indicator of retention and revenue.

---

## Funnel Metrics

### Acquisition Funnel

```
Visitor → Signs Up → Connects GitHub → Creates Project → Runs Analysis → [AHA MOMENT]
```

| Stage               | Event              | Target Rate      |
| ------------------- | ------------------ | ---------------- |
| Visitor             | page_viewed        | —                |
| Sign up             | user_signed_up     | 5–8% of visitors |
| GitHub connected    | github_connected   | 70% of signups   |
| Project created     | project_created    | 80% of connected |
| Analysis triggered  | analysis_started   | 90% of projects  |
| Analysis complete   | analysis_completed | 95% of started   |
| Viewed results >60s | analysis_engaged   | 70% of completed |

### Conversion Funnel

```
Free User → Hits Paywall → Views Pricing → Starts Trial → Upgrades
```

| Stage            | Target Rate                 |
| ---------------- | --------------------------- |
| Hits paywall     | 40% of free users (monthly) |
| Views pricing    | 80% of paywall hits         |
| Starts trial     | 30% of pricing viewers      |
| Converts to paid | 60% of trials               |

**Overall free→paid target:** 6–8%

---

## Event Tracking Specification

### User Events

```typescript
// Sign up
posthog.capture("user_signed_up", {
  method: "github" | "google" | "email",
  source: "product_hunt" | "organic" | "referral" | "unknown",
  referral_code: string | null,
});

// Onboarding
posthog.capture("onboarding_step_completed", {
  step: 1 | 2 | 3,
  step_name: "connect_github" | "create_project" | "run_analysis",
});

posthog.capture("onboarding_completed");
posthog.capture("onboarding_skipped", { at_step: number });
```

### Project Events

```typescript
posthog.capture("project_created", {
  source: "github" | "upload",
  is_private: boolean,
  language: string,
  framework: string | null,
  repo_size_kb: number,
});

posthog.capture("project_deleted", {
  project_age_days: number,
  analysis_count: number,
});
```

### Analysis Events

```typescript
posthog.capture("analysis_started", {
  trigger: "manual" | "auto" | "webhook",
  project_id: string,
  is_first_analysis: boolean,
});

posthog.capture("analysis_completed", {
  project_id: string,
  duration_ms: number,
  score: number,
  finding_count: number,
  critical_count: number,
  token_count: number,
});

posthog.capture("analysis_failed", {
  project_id: string,
  error_code: string,
  duration_ms: number,
});

posthog.capture("analysis_engaged", {
  // User spent >30 seconds on results page
  time_on_page_ms: number,
  findings_expanded: number,
  modules_viewed: number,
});
```

### Finding Events

```typescript
posthog.capture("finding_expanded", {
  finding_id: string,
  severity: string,
  module: string,
});

posthog.capture("finding_resolved", {
  finding_id: string,
  severity: string,
  days_since_analysis: number,
});

posthog.capture("finding_dismissed", {
  finding_id: string,
  reason: string | null,
});

posthog.capture("finding_rated", {
  finding_id: string,
  rating: "helpful" | "not_helpful",
});
```

### AI Advisor Events

```typescript
posthog.capture("advisor_message_sent", {
  message_index: number,
  is_suggested_prompt: boolean,
});

posthog.capture("advisor_conversation_started");

posthog.capture("advisor_code_copied", {
  // User copied a code example from advisor response
  message_index: number,
});
```

### Billing Events

```typescript
posthog.capture("paywall_hit", {
  reason: "project_limit" | "analysis_limit" | "module_locked" | "export_locked",
  current_plan: string,
});

posthog.capture("pricing_viewed", {
  source: "paywall" | "settings" | "nav" | "direct",
});

posthog.capture("trial_started", {
  plan: "pro" | "team",
});

posthog.capture("upgrade_completed", {
  from_plan: string,
  to_plan: string,
  is_annual: boolean,
  amount: number,
});

posthog.capture("subscription_canceled", {
  plan: string,
  reason: string | null,
  days_active: number,
});
```

### Sharing and Viral Events

```typescript
posthog.capture("score_card_shared", {
  platform: "twitter" | "linkedin" | "copy_link" | "other",
  score: number,
});

posthog.capture("badge_installed", {
  project_id: string,
});

posthog.capture("report_exported", {
  format: "pdf" | "markdown" | "json",
  finding_count: number,
});
```

---

## User Properties (PostHog Person Properties)

```typescript
posthog.identify(userId, {
  email: string,
  name: string,
  plan: "free" | "pro" | "team" | "enterprise",
  github_username: string | null,
  signup_date: string,
  project_count: number,
  total_analyses: number,
  last_analysis_date: string | null,
  mrr: number, // from Stripe
  is_trial: boolean,
  trial_end_date: string | null,
  acquisition_source: string,
  referral_code: string | null,
});
```

---

## Key Dashboards

### 1. Growth Dashboard (Weekly)

- New signups this week vs. last week
- Activation rate (completed first analysis)
- Source breakdown (Product Hunt, organic, referral, etc.)
- Waitlist to signup conversion

### 2. Engagement Dashboard (Daily)

- Daily Active Users
- Weekly Active Analyses
- Average analyses per user per week
- Top features used
- Advisor conversation rate

### 3. Revenue Dashboard (Daily)

- MRR, ARR
- New MRR (new customers)
- Expansion MRR (upgrades)
- Churned MRR
- Net Revenue Retention
- Free → Paid conversion rate
- Average trial-to-paid days

### 4. Product Quality Dashboard (Weekly)

- Analysis completion rate
- Average analysis duration
- Finding rating score (helpful/not helpful)
- Error rate by type
- AI cost per analysis (vs. budget)

### 5. Churn Analysis Dashboard (Weekly)

- Churn by cohort
- Churn by plan
- Days-to-churn distribution
- Exit survey responses

---

## Alerts and Thresholds

Configure PostHog or database alerts:

| Metric                   | Alert Threshold | Action                          |
| ------------------------ | --------------- | ------------------------------- |
| Analysis failure rate    | >5% in 1 hour   | Page on-call, investigate       |
| Analysis duration >5 min | Any occurrence  | Log, investigate queue          |
| Free → paid conversion   | <2% in 7 days   | Review UX, run user interviews  |
| Daily signups            | >200 (positive) | Investigate source, double down |
| Churn rate               | >8% monthly     | Immediate customer interviews   |
| AI cost per analysis     | >$1.50          | Review model usage, optimize    |

---

## Privacy Considerations

- No PII in event properties (no email addresses, names, or tokens in event data)
- PostHog configured with EU data residency for GDPR compliance
- Session replay excludes all input fields (credit card, tokens)
- Analytics opt-out available in user settings
- Cookie consent banner on marketing pages
- Server-side events for sensitive operations (Stripe conversions) to avoid ad blockers
