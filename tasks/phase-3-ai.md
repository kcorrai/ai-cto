# Phase 3 — Advanced AI Tasks

## TASK-051: AI Roadmap Generator Module

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Generate a prioritized 3-month development roadmap based on analysis findings.

### Requirements

- Input: all analysis findings + project metadata
- Output: a structured roadmap with 3 phases (Now / Next / Later)
- Each item: title, description, effort estimate, impact, dependencies
- Grouping: quick wins, medium-term improvements, long-term investments
- Export: Markdown or push to Linear (Team+)
- Considers: business stage, team size context, existing issues

### Implementation Notes

- Use claude-opus-4-8 for synthesis
- Output schema includes priority, effort, impact, category for each item
- Roadmap is NOT a direct copy of findings — it synthesizes them into actionable epics

### Dependencies

- TASK-019 (synthesis phase)

### Acceptance Criteria

- [ ] Roadmap has 10–20 items across 3 phases
- [ ] Items reference specific findings from the analysis
- [ ] Effort estimates are calibrated (not all "low")
- [ ] Export to Markdown works
- [ ] Different from generic "fix your code" advice

---

## TASK-052: AI Competitor Analyzer Module

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Identify what competitors likely have that the analyzed project lacks.

### Requirements

- User optionally inputs competitor names or URLs
- If no competitors given: AI infers competitor category from codebase
- Analyzes: what features does the codebase have vs. category benchmarks?
- Output: list of "competitors likely have X, you don't"
- Grouped by: must-have (table stakes), differentiators, nice-to-haves
- NOT a web scraping tool — AI-powered inference based on category knowledge

### Implementation Notes

- This module runs as a separate optional analysis step (not in core pipeline)
- Use claude-opus-4-8 with knowledge of SaaS category features
- Limit scope: only compare against 1–3 competitor categories
- Be clear about confidence level (inference vs. confirmed)

### Dependencies

- TASK-019

### Acceptance Criteria

- [ ] Works without user providing competitor names
- [ ] Output is specific to the project's category
- [ ] Clearly labels confidence level
- [ ] Does not claim to have scraped competitor websites

---

## TASK-053: AI Launch Readiness Score Module

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Produce a clear "is this ready to launch?" verdict with blocking issues list.

### Requirements

- Binary outcome: Launch-Ready / Not Ready + Launch Score (0–100 separate from SaaS Score)
- Blocking issues: must-fix before launch
- Advisory issues: should fix but won't kill the launch
- Checklist format for the UI
- Categories: Technical stability, Security, UX completeness, Legal basics
- Time estimate to fix all blocking issues

### Implementation Notes

- This is a synthesis module that reads all other module outputs
- Produces a structured checklist that is easy to scan
- The verdict must be clear and honest (not "it depends")

### Dependencies

- All Phase 1-2 modules

### Acceptance Criteria

- [ ] Correctly identifies launch-blocking security issues
- [ ] Distinguishes blocking from advisory
- [ ] Provides time estimate for fixing blockers
- [ ] Honest: does not say "launch-ready" for clearly unfinished products

---

## TASK-054: AI Technical Debt Scanner Module

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Produce a comprehensive technical debt inventory with business impact.

### Requirements

- Identify all significant technical debt items
- Categorize: architecture debt, code debt, test debt, documentation debt, dependency debt
- For each item: estimated remediation effort (days), business impact (velocity tax)
- Total debt estimate: "This codebase has approximately X developer-days of technical debt"
- Priority: which debt is most expensive to carry?
- Business framing: "This debt is slowing your feature velocity by approximately 20%"

### Implementation Notes

- Synthesizes findings from architecture, code quality, and testing modules
- Use claude-opus-4-8 for business-impact framing
- Keep estimates honest and bounded ("2–4 days", not false precision)

### Dependencies

- TASK-012, TASK-013, TASK-027

### Acceptance Criteria

- [ ] Inventory includes items from multiple categories
- [ ] Business-impact framing is credible
- [ ] Effort estimates are reasonable
- [ ] Total debt estimate is calculated and shown prominently

---

## TASK-055: AI Refactor Planner Module

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Identify refactoring opportunities and generate step-by-step plans.

### Requirements

- Identify top 3–5 refactoring opportunities
- For each: current state, desired state, step-by-step plan, risk assessment
- Prioritize: highest ROI refactors first (impact / effort)
- Include: safe refactoring sequence (dependency order)
- Output: actionable steps, not just descriptions

### Dependencies

- TASK-054

### Acceptance Criteria

- [ ] Refactors are specific (names actual functions/files)
- [ ] Steps are atomic and verifiable
- [ ] Risk assessment is honest
- [ ] Does not over-engineer recommendations

---

## TASK-056: AI Growth Advisor Module

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Identify missing growth and retention features.

### Requirements

- Checks for: onboarding flows, empty states, email sequences, referral program
- Identifies: missing retention hooks, missing virality features
- Benchmarks against SaaS retention best practices
- Suggests: 5 specific retention improvements with estimated impact
- Focuses on product/growth intersection (not just marketing)
- Identifies: freemium conversion opportunities

### Dependencies

- TASK-032 (SaaS maturity module)

### Acceptance Criteria

- [ ] Identifies missing onboarding for products without it
- [ ] Suggestions are product-level (not "run ads")
- [ ] Estimated impact is labeled clearly as an estimate
- [ ] Practical for indie hackers to implement

---

## TASK-057: AI Monetization Advisor Module

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Identify monetization opportunities and evaluate the current monetization setup.

### Requirements

- Evaluate existing monetization code (Stripe integration, billing, paywalls)
- Identify missing monetization features (trials, usage-based billing, add-ons)
- Suggest premium features that would justify paid tier
- Evaluate pricing strategy based on product features
- Identify revenue leakage (poor paywalls, missing upgrade prompts)
- Compare to category-standard monetization patterns

### Dependencies

- TASK-032

### Acceptance Criteria

- [ ] Identifies missing Stripe integration for projects without billing
- [ ] Identifies poorly placed paywalls
- [ ] Suggestions are specific to the product type

---

## TASK-058: Module Score Drill-Down Views

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to drill into each module's score with detailed sub-analysis.

### Requirements

- Click on any module score → opens module detail view
- Module detail: score explanation, sub-scores (where applicable), all module findings
- Visual: breakdown of what contributed to the score
- Historical: module score trend over analyses
- Module-specific insights beyond findings (e.g., Architecture module shows pattern detected)

### Dependencies

- TASK-018, TASK-043

### Acceptance Criteria

- [ ] All 12 modules have drill-down views
- [ ] Historical module scores show correctly
- [ ] Score explanation is understandable

---

## TASK-059: Historical Module Score Trends

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Show how each module score has changed across analyses.

### Requirements

- Per-module line chart across analysis history
- Summary: "Your security score improved from 41 to 68 since last month"
- Highlight: biggest improvements and biggest regressions
- Actionable: "Your testing score dropped — you may have added code without tests"

### Dependencies

- TASK-058, TASK-044

### Acceptance Criteria

- [ ] Charts render correctly with 3+ data points
- [ ] Regression detection provides explanatory message
- [ ] Works for all 12 modules

---

## TASK-060: Finding Feedback System

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to rate the quality and accuracy of individual findings.

### Requirements

- Thumbs up / thumbs down on each finding
- Optional text note on thumbs down ("This is a false positive")
- Feedback stored in database
- Admin dashboard for reviewing feedback
- Monthly prompt improvement cycle based on low-rated findings
- Not shown to users as "rating" — framed as "Was this helpful?"

### Dependencies

- TASK-020

### Acceptance Criteria

- [ ] Feedback captured and stored
- [ ] Does not interrupt the main UX
- [ ] Thumbs down allows optional reason
- [ ] Admin can see aggregate ratings per module

---

## TASK-061: Prompt Improvement Pipeline

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Build a system for systematically improving analysis prompts based on feedback.

### Requirements

- Monthly process: export low-rated findings → review patterns → update prompts
- Prompt version bumped on each improvement
- A/B testing capability: run two prompt versions on new analyses
- Compare: average rating score, user engagement, finding resolution rate
- Document prompt changes in git commit messages

### Implementation Notes

This is mostly a process, not just a feature. The tooling enables the process.

### Dependencies

- TASK-060

### Acceptance Criteria

- [ ] Prompt versions are tracked
- [ ] Low-rated findings are queryable
- [ ] A/B test infrastructure routes some % of analyses to alternate prompts
- [ ] Results of A/B test are measurable

---

## TASK-062: Analysis Quality Monitoring Dashboard

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Internal dashboard for monitoring analysis quality and costs.

### Requirements

- Average finding rating per module (last 30 days)
- Finding engagement rate (% expanded)
- Average AI cost per analysis
- Average analysis duration
- Module error rate
- Token usage by model
- Analyses per day chart

### Dependencies

- TASK-060

### Acceptance Criteria

- [ ] Dashboard shows real data
- [ ] Accessible only to admin users
- [ ] Key metrics visible at a glance

---

## TASK-063: Parallel Module Execution Optimization

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Run analysis modules in parallel to reduce total analysis time.

### Requirements

- All 12 modules execute in parallel (not sequentially)
- Synthesis waits for all modules to complete
- Failed modules do not block other modules
- Progress reflects parallel completion
- Semaphore to limit concurrent AI calls (avoid rate limits)
- Target: 12 modules in parallel in 60–90 seconds total

### Implementation Notes

- Use `Promise.allSettled()` to run all modules and collect results
- Each module is an independent Vercel Function invocation or separate async chain
- Track individual module status in `analysis_modules` table

### Dependencies

- TASK-012 through TASK-032

### Acceptance Criteria

- [ ] Analysis completes faster than sequential execution
- [ ] Failed module does not block others
- [ ] Analysis completes successfully even with 1–2 module failures

---

## TASK-064: Smart File Sampling Algorithm

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Improve the file sampling algorithm to select the most analytically valuable files.

### Requirements

- Improved priority scoring for file selection
- Framework-aware sampling (Next.js: prioritize app/api, lib; Django: views, models, urls)
- Test file selection: sample, not all tests
- Config file detection improvements
- Maximum context per module: stay under 60% of context window
- Token count estimation before sending to model

### Dependencies

- TASK-010

### Acceptance Criteria

- [ ] Next.js projects sample relevant framework files
- [ ] Config files always included
- [ ] Token count estimate prevents context overflow
- [ ] Sampling produces better findings than random selection

---

## TASK-065: Multi-Language Framework Detection

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Accurately detect programming language and framework for proper analysis context.

### Requirements

- Detect: JavaScript/TypeScript, Python, Ruby, Go, Rust, PHP, Java, C#
- Detect frameworks: Next.js, Nuxt, SvelteKit, Astro, Express, FastAPI, Django, Rails, Laravel, Spring, ASP.NET
- Detect ORM: Prisma, TypeORM, SQLAlchemy, ActiveRecord, Eloquent
- Detect testing framework: Jest, Vitest, pytest, RSpec, PHPUnit
- Detection stored in `projects.techStack` JSONB field
- Detection influences prompt context ("This is a Next.js application using Prisma...")

### Dependencies

- TASK-010

### Acceptance Criteria

- [ ] Correctly detects all listed frameworks on sample repos
- [ ] Detection confidence is tracked (certain vs. likely)
- [ ] Detection improves analysis relevance

---

## TASK-066: Code Snippet Extraction and Display

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Show relevant code snippets alongside findings where applicable.

### Requirements

- Findings can include: file path + line range
- UI shows: syntax-highlighted code snippet for that range
- Source: fetched from stored blob or re-fetched from GitHub
- Language detection for syntax highlighting
- Copy button for code snippet
- Link to GitHub source (opens file on GitHub at that line)

### Dependencies

- TASK-020

### Acceptance Criteria

- [ ] Code snippets render with correct syntax highlighting
- [ ] Copy button works
- [ ] GitHub link opens correct file at correct line
- [ ] Graceful fallback if file not available

---

## TASK-067: Finding Deduplication Across Modules

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Prevent the same issue from appearing as multiple findings from different modules.

### Requirements

- After all modules complete, run deduplication pass
- Identify semantically similar findings (same file, similar description)
- Merge duplicates into a single finding with references to both modules
- Deduplication uses embedding similarity or rule-based matching
- Track original module source on merged findings

### Implementation Notes

- Rule-based first: same file path + same severity category → candidate for merge
- AI-based: send candidate pairs to Haiku for similarity check
- Conservative: only merge obvious duplicates, err on the side of showing both

### Dependencies

- All analysis modules

### Acceptance Criteria

- [ ] Obvious duplicates are merged
- [ ] Merged findings show both source modules
- [ ] No valid distinct findings are accidentally merged

---

## TASK-068: Cross-Module Synthesis Improvements

**Phase:** 3 — Advanced AI
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Improve the synthesis phase to produce insights that only emerge when multiple modules are combined.

### Requirements

- Cross-module pattern detection:
  - "No tests + high complexity = high risk"
  - "Security issues + no rate limiting = immediate action needed"
  - "High technical debt + active feature development = velocity crisis soon"
- These cross-module insights appear as special "synthesis findings"
- Marked as "CTO Insight" to distinguish from module findings
- Weigh heavily in the executive summary

### Dependencies

- TASK-019

### Acceptance Criteria

- [ ] At least one cross-module insight for complex projects
- [ ] Insights are clearly marked as synthesis findings
- [ ] Insights are not redundant with module findings

---

## TASK-069: Model Cost Tracking Per Analysis

**Phase:** 3 — Advanced AI
**Priority:** Medium
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Track and alert on AI model costs per analysis.

### Requirements

- Track token usage per module per model
- Total cost per analysis calculated and stored
- Cost budget per plan tier enforced
- Alert if any analysis exceeds 2× expected cost
- Monthly cost dashboard for admin
- Cost breakdown: input tokens vs. output tokens

### Dependencies

- TASK-011

### Acceptance Criteria

- [ ] Token counts stored in `analysis_modules`
- [ ] Cost calculated from token counts and model rates
- [ ] Budget enforcement prevents runaway costs
- [ ] Admin dashboard shows cost trends

---

## TASK-070: A/B Testing Framework for Prompts

**Phase:** 3 — Advanced AI
**Priority:** Low
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Build infrastructure for testing prompt variations.

### Requirements

- Register multiple prompt variants per module
- Route X% of analyses to each variant
- Track: finding engagement, user ratings, finding resolution rate
- Statistical significance calculation
- Admin UI to view A/B test results
- Deploy winning variant by updating default

### Implementation Notes

- Store variant assignment per analysis
- Use PostHog feature flags for routing (or custom implementation)

### Dependencies

- TASK-061, TASK-060

### Acceptance Criteria

- [ ] Two variants of a module prompt can be configured
- [ ] Analyses are routed to variants correctly
- [ ] Results are tracked and queryable
