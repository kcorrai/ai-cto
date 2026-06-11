# Phase 6 — Enterprise Features Tasks

## TASK-101: SSO (SAML 2.0 via Clerk)

**Phase:** 6 — Enterprise
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Enable enterprise SSO via SAML 2.0 and OIDC through Clerk's Enterprise Connections.

### Requirements

- Clerk Enterprise Connections configured
- Support: Okta, Azure AD, Google Workspace, and any SAML 2.0 provider
- Per-organization SSO configuration
- Enforce SSO for organization members (password sign-in disabled)
- Just-in-time provisioning: new employees auto-added to org on first SSO login
- SSO metadata endpoint for IdP configuration
- Admin UI for SSO configuration

### Dependencies

- TASK-086, TASK-089

### Acceptance Criteria

- [ ] Okta SSO integration works end-to-end
- [ ] Azure AD SSO integration works
- [ ] JIT provisioning adds user to org
- [ ] SSO enforcement prevents password login for org members

---

## TASK-102: SCIM Provisioning

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Support SCIM 2.0 for automated user provisioning and deprovisioning.

### Requirements

- SCIM 2.0 endpoint at `/scim/v2`
- Operations: create user, update user, deactivate user, create group, update group
- Bearer token authentication for SCIM endpoint
- Automatic org membership based on SCIM group assignments
- Deprovisioned users have access removed immediately
- Compatible with: Okta, Azure AD, OneLogin

### Dependencies

- TASK-101, TASK-086

### Acceptance Criteria

- [ ] Okta SCIM integration provisions users correctly
- [ ] Deprovisioned users lose access within 5 minutes
- [ ] Group-to-role mapping works

---

## TASK-103: Advanced Audit Logs UI

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Provide enterprise customers with a comprehensive audit trail UI.

### Requirements

- Audit log viewer: searchable, filterable
- Filters: by user, action type, resource, date range
- Export: CSV, JSON
- Actions logged: sign-in, project create/delete, analysis trigger, billing changes, member changes, API key create/revoke, settings changes
- Immutable: no edit or delete capability
- Retention: configurable (default 1 year, Enterprise: up to 7 years)

### Dependencies

- TASK-086

### Acceptance Criteria

- [ ] All sensitive actions appear in audit log
- [ ] Search and filters work correctly
- [ ] CSV export works
- [ ] No way to delete or modify entries

---

## TASK-104: Custom Data Retention Policies

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow Enterprise customers to configure data retention periods.

### Requirements

- Configure: analysis retention (1 month to 7 years)
- Configure: repository content retention (delete immediately vs. retain)
- Configure: audit log retention
- Automatic cleanup job runs based on policy
- Data deletion confirmed to user
- GDPR Article 17 compliance

### Dependencies

- TASK-103

### Acceptance Criteria

- [ ] Retention policies are applied on schedule
- [ ] Old data is actually deleted (not just hidden)
- [ ] Customer can verify deletion

---

## TASK-105: White-Label Report Branding

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow Enterprise/Agency customers to brand reports with their own logo.

### Requirements

- Upload organization logo
- Logo appears on: PDF report cover, exported reports
- Custom company name in report footer
- Option: remove "Analyzed by AI CTO" attribution
- White-label URL: `reports.yourdomain.com` (custom domain via Vercel)

### Dependencies

- TASK-037, TASK-086

### Acceptance Criteria

- [ ] Logo appears in PDF exports
- [ ] Company name used in report
- [ ] Custom domain reports accessible

---

## TASK-106: GitLab Integration

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 3 days
**Status:** Backlog

### Objective

Support GitLab repositories in addition to GitHub.

### Requirements

- GitLab OAuth connection flow
- Repository browser for GitLab projects
- Project creation from GitLab repo
- Repository fetching via GitLab API
- GitLab push webhook for auto-analysis
- Support: GitLab.com and self-hosted GitLab

### Implementation Notes

- GitLab API uses different naming conventions (project vs. repository)
- Personal Access Tokens as alternative to OAuth for self-hosted
- Abstract the "repository provider" concept to support multiple providers

### Dependencies

- TASK-007, TASK-009, TASK-010

### Acceptance Criteria

- [ ] GitLab OAuth connection works
- [ ] Repositories browsable and analyzable
- [ ] Push webhook triggers analysis
- [ ] Self-hosted GitLab works with PAT

---

## TASK-107: Bitbucket Integration

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Support Bitbucket repositories.

### Requirements

- Bitbucket OAuth connection
- Repository browser for Bitbucket workspaces
- Analysis support via Bitbucket API
- Webhook support for push-triggered analysis

### Dependencies

- TASK-106 (abstract provider pattern)

### Acceptance Criteria

- [ ] Bitbucket OAuth works
- [ ] Repositories analyzable
- [ ] Webhook triggers analysis

---

## TASK-108: GitHub Enterprise Server Support

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Support self-hosted GitHub Enterprise Server instances.

### Requirements

- Custom GitHub Enterprise Server URL configuration per organization
- Personal Access Token authentication (no OAuth for GHE)
- Repository fetching from GHE API
- Network: GHE may be behind a firewall — support via IP allowlisting
- Admin UI for GHE configuration

### Dependencies

- TASK-074

### Acceptance Criteria

- [ ] Analysis works against GitHub Enterprise Server
- [ ] PAT authentication works
- [ ] Error handling for unreachable GHE instances

---

## TASK-109: Enterprise Admin Console

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Provide an admin console for enterprise account management.

### Requirements

- Organization overview: member list, project list, usage stats
- Member management: add, remove, change roles, view activity
- Usage dashboard: analyses/month, API calls, AI token usage
- Billing overview: plan, next invoice, seat count
- SSO configuration management
- SCIM configuration
- API key management (org-level keys)
- Audit log access

### Dependencies

- TASK-101, TASK-102, TASK-103

### Acceptance Criteria

- [ ] All listed sections are accessible
- [ ] Member management actions work
- [ ] Usage stats are accurate

---

## TASK-110: Bulk Project Import

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow enterprise customers to import many repositories at once.

### Requirements

- Import from: GitHub organization (all repos), CSV list of repo URLs
- Preview: show list of repos to be imported before confirming
- Queue imports: don't analyze all at once (rate limit)
- Progress: show import status with successes and failures
- Schedule: option to run initial analyses over next 24 hours

### Dependencies

- TASK-009, TASK-011

### Acceptance Criteria

- [ ] Can import 50+ repos from a GitHub org in one operation
- [ ] Import failures shown clearly
- [ ] Analysis queue doesn't get overwhelmed

---

## TASK-111: Usage Reporting and Seat Management

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Provide enterprise billing contacts with usage visibility.

### Requirements

- Monthly usage report: analyses run, API calls, AI tokens used
- Per-user breakdown: who ran the most analyses
- Per-project breakdown: most analyzed projects
- Seat count management: add/remove paid seats
- Overage reporting and alerts
- Export: CSV for finance teams

### Dependencies

- TASK-109

### Acceptance Criteria

- [ ] Usage report matches actual usage in database
- [ ] Export works as CSV
- [ ] Seat changes reflected in billing

---

## TASK-112: Invoice Billing (Net-30)

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Support invoice-based billing for enterprise customers.

### Requirements

- Stripe Invoicing with net-30 terms
- PO number field on invoice
- Purchase order workflow (for procurement)
- Manual subscription creation by admin (no credit card required at signup)
- PDF invoice download
- Wire transfer payment option
- Automatic dunning emails

### Dependencies

- TASK-022

### Acceptance Criteria

- [ ] Invoice generated with net-30 terms
- [ ] PO number appears on invoice
- [ ] PDF download works
- [ ] Dunning emails send at 7/14/21 days

---

## TASK-113: SOC 2 Audit Preparation

**Phase:** 6 — Enterprise
**Priority:** High
**Estimated Effort:** 5 days (ongoing)
**Status:** Backlog

### Objective

Prepare the product and organization for SOC 2 Type II certification.

### Requirements

- Security policy documentation
- Access control review and documentation
- Vulnerability disclosure policy
- Change management process documentation
- Incident response procedure documentation
- Vendor/processor inventory and DPAs
- Background check policy for employees
- Annual security training
- Penetration test (annual)
- Audit log completeness verification
- Encryption inventory

### Dependencies

- TASK-103, security.md

### Acceptance Criteria

- [ ] All required policies documented
- [ ] Audit logs cover all required operations
- [ ] External security firm engaged for pen test
- [ ] SOC 2 Type I achieved before Type II

---

## TASK-114: Custom Analysis Module System

**Phase:** 6 — Enterprise
**Priority:** Medium
**Estimated Effort:** 3 days
**Status:** Backlog

### Objective

Allow Enterprise customers to define custom analysis rules and modules.

### Requirements

- Custom module definition: name, description, prompt template, output schema
- Custom rules library: define specific code patterns to check for
- Per-organization module library
- Custom modules run as part of the standard pipeline
- Custom findings appear with custom module label
- UI for module creation and testing

### Dependencies

- AI pipeline infrastructure

### Acceptance Criteria

- [ ] Enterprise customer can create a custom module
- [ ] Custom module runs in analysis pipeline
- [ ] Custom findings display correctly

---

## TASK-115: On-Premise Deployment Documentation

**Phase:** 6 — Enterprise
**Priority:** Low
**Estimated Effort:** 3 days
**Status:** Backlog

### Objective

Document and support on-premise deployment for highly regulated enterprises.

### Requirements

- Docker Compose setup for all components
- Kubernetes Helm chart
- Database configuration (external Postgres)
- Redis configuration (external)
- Environment variable documentation
- Air-gapped deployment options (private LLM endpoint)
- Update process documentation

### Dependencies

- All infrastructure components

### Acceptance Criteria

- [ ] Docker Compose deployment works on a clean machine
- [ ] All components documented
- [ ] Air-gapped option documented with local LLM setup
