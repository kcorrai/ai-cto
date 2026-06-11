# Security

## Security Philosophy

Security is a first-class product requirement, not an afterthought. Users trust AI CTO with their private repositories and code. A breach is existential.

Security principles:

1. **Least privilege**: Request only the permissions needed, grant only what is required
2. **Defense in depth**: Multiple layers of protection, no single point of failure
3. **Zero trust**: Verify every request, regardless of origin
4. **Data minimization**: Do not retain data longer than necessary
5. **Transparency**: Users can see and control what data we hold

---

## Authentication

### Provider: Clerk

All authentication is delegated to Clerk. No custom auth code.

**Sign-in methods:**

- GitHub OAuth (primary — enables repository access)
- Google OAuth
- Email + password

**Session management:**

- JWT-based sessions
- Short-lived access tokens (15 minutes) + rotating refresh tokens
- Session revocation on password change or explicit sign-out
- Concurrent session limit: 10 devices (configurable per plan)

**MFA:**

- TOTP (Google Authenticator, Authy)
- Available on all paid plans
- Required for Enterprise

---

## Authorization

### Route Protection

Every protected route validates the session via Clerk middleware before reaching route handlers.

```typescript
// middleware.ts
export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});
```

### Resource-Level Authorization

Every database query for user-owned resources includes an ownership check:

```typescript
// Pattern enforced via database query wrapper
const project = await db.project.findFirst({
  where: { id: projectId, userId: currentUserId }, // ownership enforced
});
if (!project) throw new NotFoundError();
```

**Never** rely on frontend-only route guards. Authorization is always enforced in the API layer.

### Role-Based Access Control (RBAC)

Organization roles and their permissions:

| Permission          | Viewer | Editor | Admin | Owner |
| ------------------- | ------ | ------ | ----- | ----- |
| View analyses       | ✓      | ✓      | ✓     | ✓     |
| Trigger analysis    | —      | ✓      | ✓     | ✓     |
| Manage projects     | —      | ✓      | ✓     | ✓     |
| Manage members      | —      | —      | ✓     | ✓     |
| Manage billing      | —      | —      | —     | ✓     |
| Delete organization | —      | —      | —     | ✓     |

---

## GitHub Token Security

GitHub access tokens are the most sensitive data we store.

### Storage

- OAuth tokens encrypted before database storage using AES-256-GCM
- Encryption key stored in environment variable, rotated quarterly
- Tokens never logged, never included in error messages
- Tokens never returned in API responses to the client

### Access

- Tokens decrypted only inside analysis worker functions
- Decrypted tokens held in memory only for the duration of the analysis
- Tokens never written to logs or blob storage
- Workers run in isolated Vercel Function instances

### Scoping

- Request minimum required GitHub scopes:
  - `repo` (for private repos) or `public_repo` (free tier)
  - `read:user` for profile
- No write permissions requested ever

### Token Revocation

- Users can disconnect GitHub and revoke our token from their settings
- Revocation immediately deletes the stored token from our database
- Users are notified to also revoke from GitHub settings

---

## Data Security

### Encryption at Rest

- All data encrypted at rest by Neon (AES-256)
- Sensitive fields (GitHub tokens, webhook secrets) encrypted at application level before database storage
- Vercel Blob content encrypted at rest

### Encryption in Transit

- All traffic over HTTPS/TLS 1.3
- HSTS headers enforced
- No HTTP fallback

### Repository Content

- Repository content fetched for analysis is stored temporarily in Vercel Blob
- Deleted after analysis completes (default behavior)
- Pro+ users can configure retention period
- No repository content is used for AI model training

---

## API Security

### Rate Limiting

All API endpoints are rate-limited via Upstash Redis (sliding window):

| Endpoint Type    | Free   | Pro      | Team     | Enterprise |
| ---------------- | ------ | -------- | -------- | ---------- |
| Auth endpoints   | 10/min | 10/min   | 10/min   | 10/min     |
| Analysis trigger | 2/hour | 20/hour  | 100/hour | Unlimited  |
| AI Chat          | 10/min | 30/min   | 60/min   | Custom     |
| API (key auth)   | —      | 100/hour | 500/hour | Custom     |

Rate limit responses return `429 Too Many Requests` with `Retry-After` header.

### Input Validation

All API inputs validated via Zod before processing:

```typescript
const schema = z.object({
  githubUrl: z.string().url().startsWith("https://github.com/"),
  branch: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9/_.-]+$/),
});
```

**Never** trust client input without validation. Every API route has an explicit input schema.

### SQL Injection Prevention

Prisma ORM uses parameterized queries by default. No raw SQL unless absolutely necessary, and never with user input interpolated.

### CSRF Protection

- Clerk's session tokens are bound to the origin
- `SameSite=Strict` cookie flag
- API routes that mutate state require valid Clerk session

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' (hashes for known scripts);
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.clerk.dev https://api.stripe.com;
```

### Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Webhook Security

### Outbound Webhooks (User-configured)

- Each webhook has a unique HMAC secret generated on creation
- All outbound webhook payloads signed with HMAC-SHA256
- `X-AICTO-Signature-256: sha256=...` header on all deliveries
- Secrets encrypted at rest

### Inbound Webhooks (Stripe, GitHub, Clerk)

- All inbound webhooks verified by signature before processing
- Stripe: `stripe.webhooks.constructEvent()`
- GitHub: HMAC-SHA256 verification
- Clerk: Svix signature verification
- Unverified webhooks immediately rejected with 403

---

## Secrets Management

### Development

- `.env.local` for local development (never committed)
- `.env.example` committed with all required keys, no values
- `src/env.ts` — Zod-validated environment variable schema, fails at startup if invalid

### Production

- All secrets managed via Vercel project environment variables
- GitHub Actions secrets for CI-specific values
- `vercel env pull` for syncing to local development
- Secrets never in code, never in comments, never in logs

### Rotation Policy

| Secret              | Rotation Period       |
| ------------------- | --------------------- |
| Database password   | On breach or 1 year   |
| GitHub app secret   | On breach or 1 year   |
| AI provider API key | On breach or 6 months |
| Stripe API key      | On breach or 1 year   |
| Clerk secret        | On breach             |
| Encryption keys     | Every 90 days         |
| Webhook secrets     | User-controlled       |

---

## Dependency Security

- `pnpm audit` runs in CI on every PR
- Dependabot enabled for automatic security PRs
- Critical vulnerabilities block merges to main
- Monthly dependency review process
- License compatibility check in CI

---

## Monitoring and Incident Response

### Security Monitoring

- Failed authentication attempts alerted (>10/minute per IP → auto-block)
- Unusual data access patterns logged and reviewed
- Sentry captures unexpected errors with context (no sensitive data in Sentry payloads)

### Incident Response Plan

1. Detection: Automated alert or user report
2. Triage: Assess severity and scope within 1 hour
3. Containment: Isolate affected systems / revoke compromised credentials
4. Investigation: Root cause analysis
5. Remediation: Fix deployed within 24h for critical
6. Communication: Notify affected users within 72h (legal requirement)
7. Post-mortem: Written analysis published internally

### Disclosure Policy

- Security vulnerabilities can be reported to security@aicto.dev
- 90-day responsible disclosure window
- No legal action against good-faith security researchers
- Hall of fame for valid findings

---

## Compliance Considerations

### GDPR / Privacy

- Users can export all their data (GDPR Article 20)
- Users can delete all their data (GDPR Article 17)
- Data processing described in Privacy Policy
- Processor agreements in place with Neon, Clerk, Stripe, Vercel

### SOC 2 (Enterprise Roadmap)

- Audit logging for all sensitive operations (already implemented)
- Access control review process (quarterly)
- Encryption in transit and at rest (implemented)
- Incident response procedure (documented)
- Background check policy for team members

### Data Residency (Enterprise)

- EU data residency option via Neon's EU regions
- Configurable per Enterprise account
