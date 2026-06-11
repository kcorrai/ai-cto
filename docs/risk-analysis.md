# Risk Analysis

## Risk Framework

Each risk is assessed by:

- **Likelihood**: Low / Medium / High
- **Impact**: Low / Medium / High / Existential
- **Mitigation**: Specific actions to reduce likelihood or impact

---

## Technical Risks

### T1: AI Analysis Quality is Insufficient

**Likelihood:** Medium
**Impact:** High (core value proposition)

**Description:** The AI produces generic, obvious, or incorrect findings that don't justify the product's existence. Users conclude it's "just another linter."

**Mitigation:**

- Invest heavily in prompt engineering from day one
- Beta test with 20 real users and iterate on quality before launch
- Implement finding feedback loop (thumbs up/down) to measure quality
- Run the analysis on well-known projects internally and validate results manually
- Monitor finding-engagement rate; if users rarely expand findings, quality is low

**Indicators it's happening:** Low finding engagement rate (<30%), negative feedback on landing page, high churn in first week

---

### T2: GitHub API Rate Limiting

**Likelihood:** Medium
**Impact:** Medium

**Description:** High volume of analyses causes GitHub API rate limits, slowing or blocking analysis jobs.

**Mitigation:**

- Migrate from OAuth App to GitHub App for higher rate limits (10,000/hour vs. 5,000/hour)
- Implement per-user rate limiting on analysis triggers
- Cache repository metadata to avoid redundant API calls
- Queue analysis jobs to spread load
- Implement intelligent sampling to reduce API calls per analysis

---

### T3: LLM Costs Exceed Revenue

**Likelihood:** Low-Medium
**Impact:** High

**Description:** Token costs per analysis grow faster than revenue, especially if users abuse the free tier.

**Mitigation:**

- Per-analysis token budget enforced hard in the pipeline
- Free tier limited to 5 modules and 2 analyses/month
- Repository size limits and per-file sampling
- Caching: skip analysis if repo unchanged (same git hash)
- Monthly token cost monitoring with alerts
- Fallback to cheaper models under cost pressure
- Over-provisioning protection: analysis queue priority by plan

---

### T4: Infrastructure Failure During Analysis

**Likelihood:** Low
**Impact:** Medium

**Description:** Vercel Function timeout, queue failure, or database outage causes analyses to fail silently.

**Mitigation:**

- Idempotent job handlers (safe to retry)
- At-least-once delivery via Vercel Queues
- Analysis status tracked in database (never "stuck" in running state)
- Automatic retry for infrastructure-level failures (not logic failures)
- Timeout handling: mark analysis failed after 5 minutes, never leave in "running"
- User-facing retry button for all failed analyses

---

### T5: Security Breach / GitHub Token Compromise

**Likelihood:** Low
**Impact:** Existential

**Description:** A vulnerability allows an attacker to access users' GitHub tokens, exposing private repositories.

**Mitigation:**

- Application-level encryption of all tokens (AES-256-GCM)
- Tokens only decrypted in worker functions, never returned to client
- Regular security reviews
- Rate limiting and anomaly detection
- Penetration testing before launch
- Clear incident response plan and user notification process
- Request minimum necessary GitHub scopes (read-only)

---

### T6: Large Repository Performance

**Likelihood:** High (common case)
**Impact:** Medium

**Description:** Repositories with 50k+ files cause analysis timeouts or excessive AI costs.

**Mitigation:**

- Intelligent file sampling strategy (see `ai-system-design.md`)
- Repository size limits per plan (warn at 10k files, block at 100k for free)
- Parallel module execution to reduce wall-clock time
- Progressive analysis: return partial results as modules complete
- Clear size-based pricing (overages for very large repos)

---

## Business Risks

### B1: No Defensible Moat Against OpenAI/Anthropic

**Likelihood:** Medium
**Impact:** High

**Description:** OpenAI or Anthropic launches "ChatGPT for Code Review" with similar capabilities and distribution advantage.

**Mitigation:**

- Moat is in the specific product experience, integrations, and data — not the model
- Build GitHub App, Linear, and Slack integrations that create switching costs
- Accumulate proprietary benchmarking data across thousands of repos
- Brand "AI CTO" as a category name before incumbents
- Move up-market to Enterprise before big players target indie hackers
- Build community and loyalty around the brand

---

### B2: Market Too Small to Build a Venture-Scale Business

**Likelihood:** Low-Medium
**Impact:** Medium

**Description:** Indie hackers and SaaS founders don't convert to paying customers at sufficient rates; the total addressable market is too small.

**Mitigation:**

- Not planning venture scale — profitable indie business is a valid outcome
- The TAM for developer tools is large and growing
- Expand to agencies, accelerators, and small dev teams (larger contracts)
- Expand to Team and Enterprise before exhausting indie hacker market
- Content marketing captures non-indie developers searching for related keywords

---

### B3: Category Creation Fails — Users Don't Understand the Product

**Likelihood:** Medium
**Impact:** High

**Description:** "AI CTO" is too abstract. Users don't understand what they get or why it's different from existing tools.

**Mitigation:**

- Lead with specific, concrete outputs ("23 findings, 3 critical") not abstractions
- Demo video shows a real analysis in 60 seconds
- Landing page headline focuses on outcome: "Know what to fix before you launch"
- Beta test landing page messaging with 10 target users before launch
- A/B test multiple positioning angles at launch

---

### B4: Early Users Are Wrong Audience

**Likelihood:** Medium
**Impact:** Medium

**Description:** Product Hunt / HN traffic attracts curious developers, not target users. High signups, low retention.

**Mitigation:**

- Pre-qualify with targeted messaging ("for indie hackers and SaaS founders")
- Measure quality of signups (do they connect GitHub? Run an analysis?)
- Focus post-launch outreach on specific communities (IndieHackers, not general tech Twitter)
- Retention metrics from day 1 — not just acquisition numbers

---

### B5: Churn Too High to Achieve Profitability

**Likelihood:** Medium
**Impact:** High

**Description:** Monthly churn exceeds 8%, making it impossible to grow revenue faster than it churns.

**Mitigation:**

- Understand churn reasons via exit surveys from day 1
- Focus on activation quality (first analysis must deliver value)
- Weekly digest emails maintain engagement habit
- Auto-analysis on push creates an ongoing reason to maintain subscription
- Annual discounts reduce monthly churn significantly

---

## Regulatory and Compliance Risks

### R1: GDPR / Privacy Law Violations

**Likelihood:** Low
**Impact:** High

**Description:** Improper handling of EU user data leads to GDPR enforcement action.

**Mitigation:**

- Privacy policy written and reviewed by legal
- Data processing agreements with all processors (Neon, Clerk, Vercel)
- User data export and deletion functionality (GDPR Articles 15/17)
- EU data residency option (Neon EU region)
- Cookie consent on marketing pages
- No user data used for AI training

---

### R2: GitHub Terms of Service Violation

**Likelihood:** Low
**Impact:** High

**Description:** AI CTO's use of GitHub API violates ToS, causing suspension.

**Mitigation:**

- Carefully review GitHub API ToS before launch
- Migrate to GitHub App (better compliance path)
- Never scrape GitHub — only use authorized API access with user consent
- No caching of repository content beyond the analysis window
- Consult a lawyer on the GitHub API Terms before launch if uncertain

---

## Competitor Risks

### C1: Existing Player Pivots into This Category

**Likelihood:** Low
**Impact:** Medium

**Description:** SonarQube, CodeClimate, or a well-funded startup pivots to target our exact positioning.

**Mitigation:**

- Speed matters — ship and get users before this becomes likely
- Focus on the product experience gap (strategic advisor, not linter) — this is hard to pivot into
- Build brand and community loyalty
- Lock in integrations (GitHub App, Linear, Slack) that create switching costs

---

## Risk Priority Matrix

| Risk                       | Likelihood | Impact      | Priority |
| -------------------------- | ---------- | ----------- | -------- |
| T5: Security breach        | Low        | Existential | CRITICAL |
| T1: Analysis quality       | Medium     | High        | HIGH     |
| B3: Category confusion     | Medium     | High        | HIGH     |
| T3: LLM costs              | Medium     | High        | HIGH     |
| B5: High churn             | Medium     | High        | HIGH     |
| T2: GitHub rate limits     | Medium     | Medium      | MEDIUM   |
| T6: Large repos            | High       | Medium      | MEDIUM   |
| B1: BigTech competition    | Medium     | High        | MEDIUM   |
| T4: Infrastructure failure | Low        | Medium      | MEDIUM   |
| R1: GDPR                   | Low        | High        | MEDIUM   |
| B2: Small TAM              | Low        | Medium      | LOW      |
| B4: Wrong audience         | Medium     | Medium      | LOW      |
