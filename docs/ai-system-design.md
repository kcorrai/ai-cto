# AI System Design

## Overview

The AI system is the core differentiator of AI CTO. It is designed as a multi-module pipeline that analyzes a repository from multiple lenses simultaneously, then synthesizes the results into strategic recommendations.

The system must:

- Produce genuinely insightful, non-generic findings
- Be fast enough to feel responsive (target: full analysis in under 3 minutes)
- Be cost-efficient enough to be profitable at the Pro tier price point
- Produce structured, machine-readable output for reliable UI rendering
- Gracefully handle errors in individual modules without failing the whole analysis

---

## Analysis Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Analysis Request                       │
│              (User triggers, webhook, scheduled)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  Repository Fetcher                       │
│                                                           │
│  1. Authenticate with GitHub API                          │
│  2. Fetch repository metadata                             │
│  3. Fetch file tree (recursive)                           │
│  4. Select files for analysis (sampling strategy)         │
│  5. Fetch selected file contents                          │
│  6. Store raw content in Vercel Blob                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  Pre-Analysis Phase                       │
│                                                           │
│  - Detect primary language(s)                             │
│  - Detect framework(s) (Next.js, Laravel, Django, etc.)   │
│  - Classify files (source, test, config, docs, assets)    │
│  - Extract dependencies (package.json, Gemfile, etc.)     │
│  - Identify key architectural files                       │
│  - Build context bundle per module                        │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │  Parallel Module Execution    │
         │                               │
┌────────▼──────┐  ┌────────────┐  ┌────▼────────┐
│ Architecture  │  │  Security  │  │  Code Qual. │  ...
│    Module     │  │   Module   │  │   Module    │
└────────┬──────┘  └─────┬──────┘  └────┬────────┘
         │               │              │
         └───────────────┼──────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Synthesis Phase                         │
│                                                           │
│  - Aggregate all module findings                          │
│  - Deduplicate overlapping findings                       │
│  - Cross-module reasoning (e.g., security + architecture) │
│  - Calculate SaaS Score (weighted average)                │
│  - Generate executive summary                             │
│  - Prioritize and rank all recommendations                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Output Phase                            │
│                                                           │
│  - Store structured results in database                   │
│  - Generate report exports (PDF, Markdown, JSON)          │
│  - Trigger notifications                                  │
│  - Update project score and metadata                      │
└─────────────────────────────────────────────────────────┘
```

---

## Analysis Modules

### Module 1: Architecture Analysis

**Purpose:** Evaluate the structural design of the system.

**Inputs:**

- File tree structure
- Entry point files (index.ts, app.ts, main.py, etc.)
- Configuration files (next.config.ts, vite.config.ts, etc.)
- Dependency list

**Analysis Questions:**

- Is there a clear separation of concerns?
- Is the data flow unidirectional and traceable?
- Are there circular dependencies?
- Is the folder structure logical and consistent?
- What design patterns are in use? Are they appropriate?
- Does the architecture support the apparent scale goals?
- Are there monolith vs. microservice concerns?
- Is there appropriate abstraction (not too much, not too little)?

**Output Schema:**

```typescript
{
  score: number,           // 0-100
  pattern: string,         // "MVC", "Layered", "Event-driven", etc.
  strengths: string[],
  findings: Finding[],
  recommendations: Recommendation[]
}
```

---

### Module 2: Code Quality Analysis

**Purpose:** Evaluate code maintainability, readability, and correctness.

**Inputs:**

- Sample of source files (up to 50 most significant files)
- Test files

**Analysis Questions:**

- Is the code readable and well-named?
- Are functions appropriately sized and focused?
- Is there excessive duplication (DRY violations)?
- Are there obvious bugs or logic errors?
- Is error handling consistent and appropriate?
- Is there appropriate use of types (if typed language)?
- Are there code smells (long methods, god objects, etc.)?
- Is the code testable by design?

---

### Module 3: Security Analysis

**Purpose:** Identify security vulnerabilities and risks.

**Inputs:**

- Authentication-related files
- API route handlers
- Database query code
- Environment variable usage
- Dependency versions (checked against known CVEs conceptually)
- Input handling code

**Analysis Questions:**

- Are there SQL injection risks?
- Is user input validated and sanitized?
- Are secrets handled securely (not in code, properly scoped)?
- Is authentication implemented correctly?
- Are authorization checks consistent?
- Are there CSRF vulnerabilities?
- Is sensitive data encrypted?
- Are there insecure direct object reference patterns?
- Are dependencies outdated with known vulnerabilities?

---

### Module 4: Performance Analysis

**Purpose:** Identify performance bottlenecks and anti-patterns.

**Analysis Questions:**

- Are there N+1 query patterns?
- Is caching used appropriately?
- Are there unnecessary re-renders or computations (frontend)?
- Are database queries indexed?
- Are large operations async?
- Is pagination implemented for large datasets?
- Are images and assets optimized?
- Are there memory leak patterns?

---

### Module 5: Testing Coverage Analysis

**Purpose:** Evaluate test coverage and testing strategy.

**Inputs:**

- Test files
- Test configuration files
- CI configuration

**Analysis Questions:**

- What is the estimated test coverage?
- Are critical paths tested?
- Is there a testing strategy (unit, integration, E2E)?
- Is testing infrastructure set up correctly?
- Are tests meaningful (not testing implementation details)?
- Is there CI/CD running tests?

---

### Module 6: Documentation Analysis

**Purpose:** Evaluate documentation completeness for developers and users.

**Analysis Questions:**

- Is there a README with setup instructions?
- Are APIs documented?
- Is there inline documentation for complex logic?
- Is there a CONTRIBUTING guide?
- Is there a changelog?
- Are environment variables documented?
- Is there user-facing documentation or help system?

---

### Module 7: Dependencies Analysis

**Purpose:** Evaluate dependency health and management.

**Analysis Questions:**

- Are dependencies up to date?
- Are there known vulnerability patterns (outdated major versions)?
- Are dependencies appropriate for the use case?
- Is there excessive dependency bloat?
- Are dev dependencies properly separated?
- Is there a lock file?
- Are there license compatibility issues?

---

### Module 8: API Design Analysis

**Purpose:** Evaluate API quality and developer experience.

**Analysis Questions:**

- Are endpoints consistently named and structured?
- Is error handling consistent and informative?
- Are HTTP methods used semantically?
- Is there versioning?
- Is there input validation?
- Are responses consistently structured?
- Is there rate limiting?
- Is there API documentation?

---

### Module 9: Database Design Analysis

**Purpose:** Evaluate data model and database usage.

**Analysis Questions:**

- Is the schema normalized appropriately?
- Are indexes used correctly?
- Are there N+1 patterns in data access?
- Is the ORM used efficiently?
- Are migrations managed properly?
- Is there connection pooling?
- Is sensitive data encrypted?
- Are there backup/recovery mechanisms?

---

### Module 10: DevOps and CI/CD Analysis

**Purpose:** Evaluate deployment, infrastructure, and operations.

**Analysis Questions:**

- Is there a CI/CD pipeline?
- Are deployments automated?
- Are environment configs managed properly?
- Is there environment parity (dev ≈ production)?
- Are secrets managed securely (not in code)?
- Is there monitoring/alerting?
- Is there a rollback strategy?
- Are Docker/containers used appropriately?

---

### Module 11: Product Readiness Analysis

**Purpose:** Evaluate product completeness from a user perspective.

**Analysis Questions:**

- Are there onboarding flows?
- Is there error handling that users see?
- Are there loading states and empty states?
- Is there user feedback on actions?
- Are there accessibility considerations?
- Is there mobile responsiveness?
- Are there privacy policy and terms pages?
- Are there user support mechanisms?
- Is there analytics/telemetry?

---

### Module 12: SaaS Maturity Analysis

**Purpose:** Evaluate product readiness as a commercial SaaS.

**Analysis Questions:**

- Is there authentication and user management?
- Is there subscription/billing infrastructure?
- Are there user limits and plan enforcement?
- Is there multi-tenancy?
- Are there admin tools?
- Is there usage tracking?
- Are there webhooks for integration?
- Is there an API for power users?
- Are there email notifications?
- Is there a customer feedback mechanism?
- Is there a status page?
- Are there rate limits?

---

## SaaS Score Algorithm

The SaaS Score (0–100) is a weighted composite:

| Module            | Weight |
| ----------------- | ------ |
| Architecture      | 15%    |
| Code Quality      | 12%    |
| Security          | 18%    |
| Performance       | 8%     |
| Testing           | 10%    |
| Documentation     | 5%     |
| Dependencies      | 7%     |
| API Design        | 5%     |
| Database Design   | 8%     |
| DevOps / CI       | 7%     |
| Product Readiness | 8%     |
| SaaS Maturity     | 10%    |

**Score Ranges:**

- 80–100: Launch-Ready
- 65–79: Nearly There
- 50–64: Needs Work
- 35–49: Early Stage
- 0–34: Pre-Alpha

---

## Prompt Engineering Strategy

### Prompt Architecture

All prompts follow a consistent structure:

```
[System Context]
You are an expert CTO conducting a professional technical audit of a software project.
Your analysis will be used by the founder to make strategic decisions.
Be specific, honest, and actionable. Avoid generic advice.

[Repository Context]
Project: {name}
Language: {language}
Framework: {framework}
Stage: {detected stage}
Key dependencies: {deps}

[Module-Specific Instructions]
{module-specific instructions and analysis focus}

[Input Files]
{relevant file contents}

[Output Format]
{Zod schema definition for structured output}
```

### Prompt Version Control

- All prompts stored in `src/lib/ai/prompts/` as TypeScript files
- Version tracked in git
- Changes to prompts require a comment explaining the reason
- A/B testing framework for evaluating prompt improvements

### Context Window Management

For large repositories, intelligent sampling is critical:

**File Selection Priority:**

1. Entry points (index.ts, app.ts, main.py, server.ts)
2. Configuration files (next.config.ts, package.json, .env.example)
3. Core domain models and schemas
4. Key business logic files (services, handlers)
5. Database schema files
6. CI/CD configuration
7. README and documentation

**Sampling Strategy:**

- Never send >60% of context window to any single module
- Prefer breadth over depth — sample many files shallowly vs. few files fully
- Always include package.json / dependency manifest
- Always include the primary configuration file

---

## AI Chat Advisor

The conversational interface that allows users to ask follow-up questions about their analysis.

### Context Strategy

Each conversation has access to:

1. The latest analysis results for the project
2. The full finding list
3. The executive summary
4. The last 20 messages in the conversation

### System Prompt

The advisor is configured as an expert CTO reviewing this specific project. It has access to the analysis results as structured context and responds in a direct, opinionated manner.

### Streaming

All advisor responses are streamed using Vercel AI SDK `streamText`. This provides immediate feedback to the user and reduces perceived latency.

### Tool Calls

The advisor can use tools to:

- Look up specific findings by ID
- Retrieve module-specific details
- Search the findings list
- Generate code examples for a recommendation

---

## Model Cost Management

### Per-Analysis Cost Estimates

| Model                     | Use case                     | Est. cost/analysis |
| ------------------------- | ---------------------------- | ------------------ |
| claude-haiku-4-5-20251001 | Pre-analysis, classification | $0.02              |
| claude-sonnet-4-6         | Module analysis (×12)        | $0.30              |
| claude-opus-4-8           | Synthesis                    | $0.25              |
| **Total**                 |                              | **~$0.57**         |

At $29/month Pro tier with 20 analyses/month = $11.40 AI costs → ~39% margin before infrastructure. Acceptable. Optimized further with caching unchanged repos.

### Cost Controls

- Analysis skipped if repo unchanged since last analysis (git hash check)
- Module results cached for unchanged file sets
- Free tier limited to 5 core modules (vs. 12 for Pro)
- Per-user monthly token budget enforced before job submission
- Automatic fallback to claude-sonnet-4-6 if claude-opus-4-8 rate limits hit

---

## Output Quality Assurance

### Structured Output Validation

All AI outputs are parsed via Zod schemas. Invalid outputs trigger:

1. Retry with clarification prompt (max 2 retries)
2. Module marked as failed with error stored
3. Analysis continues without failed module

### Hallucination Mitigation

- Always ground recommendations in specific files/line numbers when available
- Never claim a file exists that was not in the input
- Explicitly state uncertainty with hedging language
- Module prompts instruct the model to say "not applicable" vs. fabricate findings

### Human Feedback Loop (Post-Launch)

- Users can rate individual findings (thumbs up/down)
- Users can mark findings as resolved
- Feedback data used to improve prompts over time
- Monthly prompt review cycle based on feedback aggregation
