# Monetization

## Business Model Overview

**Primary Model:** Subscription SaaS (monthly and annual billing)
**Secondary Model:** Usage-based overages for large repositories
**Future Model:** Marketplace (expert advisors, custom analysis modules)

---

## Pricing Tiers

### Free

**Price:** $0/month forever
**Purpose:** Acquisition, virality, proof of value

| Feature                 | Limit               |
| ----------------------- | ------------------- |
| Projects                | 1 active project    |
| Analyses per month      | 2                   |
| AI Chat advisor queries | 10/month            |
| Analysis modules        | Core 5 modules only |
| Report export           | Shareable link only |
| History                 | 7-day retention     |
| GitHub repos            | Public repos only   |
| Private repos           | No                  |
| Team members            | 1 (solo only)       |
| API access              | No                  |
| SaaS Score              | Yes (shareable)     |
| Community support       | Yes                 |

**Free Tier Philosophy:**
Free users must experience genuine value and share it. The SaaS Score and shareable analysis link are the virality engine. Free limits are tight enough to drive upgrades but loose enough to convert skeptics.

---

### Pro

**Price:** $29/month · $290/year (save 17%)
**Target:** Indie hackers, solo founders, freelancers
**Purpose:** Core monetization tier

| Feature                 | Limit               |
| ----------------------- | ------------------- |
| Projects                | 5 active projects   |
| Analyses per month      | 20                  |
| AI Chat advisor queries | Unlimited           |
| Analysis modules        | All 12 modules      |
| Report export           | PDF, Markdown, JSON |
| History                 | 90-day retention    |
| GitHub repos            | Public + Private    |
| Private repos           | Yes                 |
| Team members            | 1 (solo only)       |
| API access              | Read-only           |
| Weekly digest email     | Yes                 |
| Priority queue          | Standard            |
| Email support           | Yes                 |
| SaaS Score              | Yes                 |
| Badge                   | Yes                 |

---

### Team

**Price:** $99/month · $990/year (save 17%)
**Target:** Small startups, co-founders, small engineering teams
**Purpose:** Expansion revenue, team collaboration

| Feature                   | Limit                            |
| ------------------------- | -------------------------------- |
| Projects                  | 20 active projects               |
| Analyses per month        | Unlimited                        |
| AI Chat advisor queries   | Unlimited                        |
| Analysis modules          | All modules + Beta modules       |
| Report export             | PDF, Markdown, JSON, Notion sync |
| History                   | 1-year retention                 |
| GitHub repos              | Public + Private + Organizations |
| GitHub Organizations      | Yes                              |
| Team members              | Up to 10                         |
| Roles                     | Admin, Editor, Viewer            |
| API access                | Full REST API                    |
| Webhooks                  | Yes                              |
| Linear integration        | Yes                              |
| Slack notifications       | Yes                              |
| Priority queue            | High priority                    |
| Priority support          | Yes                              |
| Custom branding (reports) | Logo on exports                  |

---

### Enterprise

**Price:** Custom (starting ~$500/month)
**Target:** Funded startups, agencies, accelerators
**Purpose:** High-value accounts, custom requirements

| Feature                      | Limit             |
| ---------------------------- | ----------------- |
| Projects                     | Unlimited         |
| Analyses per month           | Unlimited         |
| Team members                 | Unlimited         |
| SSO (SAML, OIDC)             | Yes               |
| SCIM provisioning            | Yes               |
| Custom analysis modules      | Yes               |
| On-premise deployment option | Yes               |
| Dedicated AI capacity        | Yes               |
| SLA                          | 99.9% uptime SLA  |
| SOC 2 compliance             | Yes               |
| Custom data retention        | Configurable      |
| White-label                  | Yes (agency tier) |
| Dedicated account manager    | Yes               |
| Custom integrations          | On request        |
| Audit logs                   | Full audit trail  |
| Procurement / invoicing      | Yes               |

---

## Pricing Strategy

### Anchoring

The Team tier ($99) is designed to anchor perception. When users see the gap between Pro ($29) and Team ($99), Pro feels like exceptional value. Enterprise anchors Team.

### Annual Discount

17% discount on annual plans (2 months free). This improves cash flow and reduces churn. Push annual prominently.

### Free Trial

New Pro and Team accounts get a 14-day free trial — no credit card required. Credit card required to continue after trial.

### Grandfathering

Early users who join during beta get lifetime pricing at 50% off their tier. This creates urgency and rewards early adopters.

---

## Revenue Projections

### Year 1 Targets

| Month | Free Users | Pro | Team | Enterprise | MRR     |
| ----- | ---------- | --- | ---- | ---------- | ------- |
| M1    | 200        | 10  | 0    | 0          | $290    |
| M3    | 800        | 50  | 5    | 0          | $1,945  |
| M6    | 2,500      | 150 | 20   | 1          | $6,850  |
| M9    | 6,000      | 350 | 50   | 3          | $16,650 |
| M12   | 12,000     | 700 | 100  | 8          | $34,300 |

**Target ARR at Month 12:** ~$400k

### Key Revenue Assumptions

- Free-to-paid conversion: 6–8% (developer tool benchmark: 5–10%)
- Pro-to-Team upgrade rate: 12% of Pro
- Annual plan take rate: 30% of paying users
- Monthly churn: 3–5% (developer tool benchmark)
- Average deal size (Enterprise): $600/month

---

## Usage-Based Overages

For repositories over a defined size threshold:

| Threshold   | Overage       |
| ----------- | ------------- |
| >10k files  | +$5/analysis  |
| >50k files  | +$15/analysis |
| >100k files | +$30/analysis |

This ensures large monorepos do not create infrastructure losses and creates natural segmentation toward Enterprise.

---

## Future Revenue Streams

### Marketplace (Year 2+)

- **Expert advisor sessions**: connect with human fractional CTOs via the platform
- **Custom analysis plugins**: third-party developers sell specialized analysis modules
- **Report templates**: premium report templates for investor due diligence, security audits, etc.

### Data Products (Year 3+)

- **SaaS Benchmark Reports**: industry-wide analysis of SaaS architectural patterns
- **Technology Trend Data**: which frameworks/patterns are growing in the indie hacker ecosystem

### Referral and Affiliate (Year 1+)

- **Affiliate program**: 30% recurring commission for 12 months
- **Integration partnerships**: revenue share with tools we recommend in analyses (Neon, Resend, Clerk)

---

## Billing Implementation

- **Payment processor**: Stripe
- **Subscription management**: Stripe Billing
- **Invoicing**: Stripe Invoicing (automatic for all paid tiers)
- **Usage metering**: Stripe Billing Meters for overage tracking
- **Tax compliance**: Stripe Tax (automatic global tax calculation)
- **Dunning**: Stripe's built-in dunning + custom 3-email sequence
- **Customer portal**: Stripe Customer Portal for self-serve plan changes

---

## Discounts and Promotions

| Type                   | Amount         | Rules                                          |
| ---------------------- | -------------- | ---------------------------------------------- |
| Annual                 | 17%            | Applied automatically                          |
| Student                | 50%            | Verified via .edu email or GitHub Student Pack |
| Nonprofit              | 40%            | Manual verification                            |
| Open source maintainer | Free Pro       | Verified via GitHub (>100 stars public repo)   |
| Early bird (launch)    | 30% lifetime   | First 500 paying customers                     |
| Partner referral       | 20% first year | Via affiliate codes                            |
