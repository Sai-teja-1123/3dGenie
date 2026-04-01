# Deployment Guide (Manager-Friendly)

This document explains how we will deploy the product as a website, what tools we need, expected costs, and how we can optionally store person images for a limited number of days.

---

## 1) Deployment Scope

We will deploy:
- Frontend web application (public website)
- Backend API service
- Database (for app records and metadata)
- Optional object storage (for uploaded/generated images)
- Domain, SSL, monitoring, and security basics

---

## 2) Platform Options (As Requested)

### Frontend Hosting
- **Option A:** Vercel
- **Option B:** Render (Static Site)

### Backend Hosting
- **Option A:** Render (Web Service)
- **Option B:** Railway

### Database
- Managed PostgreSQL (recommended), via:
  - Render Postgres, or
  - Railway Postgres

### Optional Object Storage (for images/files)
- If we need scalable and cost-efficient image retention:
  - AWS S3, Cloudflare R2, or Supabase Storage

---

## 3) Recommended Deployment Combinations

### Combination 1 (Simple + Stable)
- Frontend: **Vercel**
- Backend: **Render**
- Database: Render Postgres
- Object storage: Optional (S3/R2/Supabase)

### Combination 2 (Single vendor style)
- Frontend: **Render**
- Backend: **Render**
- Database: Render Postgres
- Object storage: Optional

### Combination 3 (Fast iteration teams)
- Frontend: **Vercel** or **Render**
- Backend: **Railway**
- Database: Railway Postgres
- Object storage: Optional

---

## 4) What We Need To Set Up (End-to-End)

### A) Frontend
- Connect Git repository to Vercel or Render
- Configure build command and output directory
- Set production environment variables (API base URL, feature flags)
- Add custom domain and SSL certificate

### B) Backend
- Connect backend service to Render or Railway
- Configure runtime, start command, and environment variables
- Restrict CORS to production frontend domain
- Enable health checks and restart policy

### C) Database
- Provision managed PostgreSQL instance
- Create schema/migrations
- Store only business data and image metadata (not heavy files)
- Enable backups and access controls

### D) Optional Object Storage
- Create bucket/container for images
- Keep bucket private (no public listing)
- Use signed URLs for temporary access if needed
- Configure lifecycle rule to auto-delete files after defined retention period

### E) Operations and Security
- Basic monitoring (uptime + error logs)
- Alerting for downtime and high error rate
- Secret management for API keys and DB credentials
- HTTPS everywhere, least-privilege access

---

## 5) Cost Overview in INR (Based on Selected Services)

> Currency basis for planning: **1 USD ~= Rs. 83**.  
> Final billing depends on provider region, taxes, and current pricing at purchase time.

### Free and paid options by service

#### Frontend (Vercel or Render)
- **Vercel (Free/Hobby):** **Rs. 0/month** (small projects, limited usage)
- **Vercel (Paid/Pro):** about **Rs. 1,660 per user/month** (USD 20/user/month)
- **Render Static Site (Free):** **Rs. 0/month** (within free limits)
- **Render Static Site (Paid):** usually still low; cost mostly appears when traffic/bandwidth increases

#### Backend API (Render or Railway)
- **Render Web Service (Paid starter):** starts around **Rs. 580/month** (USD 7/month)
- **Railway (usage-based):** starts around **Rs. 415/month** (USD 5/month), then scales by resource usage

#### Database (Managed PostgreSQL)
- **Render Postgres (starter):** starts around **Rs. 580/month** (USD 7/month)
- **Railway Postgres:** usage-based, usually starts around **Rs. 415/month** and grows with CPU/RAM/storage

#### Domain and SSL
- **Domain (.com typical):** about **Rs. 900-Rs. 1,800/year**
- **SSL certificate:** **Rs. 0** (included by Vercel/Render/Railway for standard setup)

#### Optional object storage (only if image retention at scale is needed)
- **AWS S3 Standard:** about **Rs. 1.9/GB/month** storage (USD 0.023/GB/month)
- **Cloudflare R2:** about **Rs. 1.25/GB/month** storage (USD 0.015/GB/month)
- Request and egress charges apply when image traffic grows

---

## 6) Operations Cost Breakdown in INR (Calculated Scenarios)

### Scenario A: MVP with maximum free usage
- Frontend: Vercel Free or Render Static Free = **Rs. 0/month**
- Backend: minimum paid (Render or Railway) = **Rs. 415-Rs. 580/month**
- Database: minimum paid (Railway/Render Postgres) = **Rs. 415-Rs. 580/month**
- SSL = **Rs. 0/month**
- Domain (annual) = **Rs. 900-Rs. 1,800/year**
- **Estimated monthly run-rate:** **Rs. 830-Rs. 1,160/month** (+ domain annual)

### Scenario B: Small production (1 paid frontend seat)
- Frontend: Vercel Pro (1 user) = **Rs. 1,660/month**  
  or keep Render static if free tier is sufficient
- Backend: Render or Railway starter = **Rs. 415-Rs. 580/month**
- Database: starter managed Postgres = **Rs. 415-Rs. 580/month**
- SSL = **Rs. 0/month**
- Domain = **Rs. 900-Rs. 1,800/year**
- **Estimated monthly run-rate:** **Rs. 2,490-Rs. 2,820/month** (+ domain annual)

### Scenario C: Scaled usage (compute + DB increase)
- Frontend: Vercel Pro seats as needed (Rs. 1,660 x number of users), or Render static with bandwidth growth
- Backend: move to larger instance(s) on Render/Railway as traffic increases
- Database: move to higher tier for RAM/storage/connections
- Optional object storage for images: add storage + request/egress billing
- **Expected direction:** monthly spend increases mostly from backend compute, DB sizing, and bandwidth

### Optional add-on: object storage estimate for retention
- Example: 50 GB retained images
  - S3 storage only: **~Rs. 95/month** (50 x Rs. 1.9)
  - R2 storage only: **~Rs. 62.5/month** (50 x Rs. 1.25)
- Note: API request and bandwidth charges are additional

### Cost controls we should enable from day one
- Monthly budget alerts in Vercel/Render/Railway/cloud dashboards
- Log retention limits (avoid unlimited retention by default)
- Image retention auto-delete policy (3/5/7 days)
- Monthly rightsizing review for backend and database tiers
- Start free where possible, move to paid only on clear usage trigger

---

## 7) Image Storage for a Few Days (Possible and Recommended)

Yes, we can store person images for a limited period.

Recommended pattern:
- Store actual images in object storage (optional but preferred for scale)
- Store metadata in database:
  - user or request ID
  - file path/key
  - created timestamp
  - expiry timestamp
- Auto-delete using:
  - Storage lifecycle rule (preferred), or
  - Scheduled cleanup job in backend

Suggested retention flow:
1. Upload image
2. Save metadata with expiry date (e.g., +3 to +7 days)
3. System auto-deletes on expiry
4. Cleanup job removes stale database records if needed

---

## 8) Legal and Privacy Considerations (Important)

Because images of people may be personal data:
- Add explicit user consent text before upload
- Define retention period clearly in privacy policy
- Explain deletion behavior and support requests
- Restrict internal access to stored images
- Keep audit/log trail for access where possible

---

## 9) Cookie Policy and Consent Requirements

For website compliance and transparency, we should publish a cookie policy and implement a consent banner.

### Cookie categories to define
- **Strictly necessary cookies:** session/security cookies required for the app to work
- **Analytics cookies (optional):** usage tracking for product insights
- **Marketing cookies (optional):** only if ad/remarketing tools are used

### What we should implement
- Cookie banner on first visit with:
  - Accept all
  - Reject non-essential
  - Customize preferences
- Keep analytics/marketing disabled until consent is given
- Store consent choice and allow users to change it later
- Link banner to Privacy Policy and Cookie Policy pages

### Cookie policy document should include
- What cookies are used and why
- Cookie duration (session or persistent)
- Third-party tools used (if any)
- How users can withdraw consent
- Contact point for privacy requests

### Ongoing governance
- Review cookie list quarterly
- Remove unused tracking scripts
- Keep policy updated when tools change

---

## 10) Proposed Rollout Plan

### Phase 1: Go-Live Baseline
- Deploy frontend + backend + database
- Configure custom domain and SSL
- Add monitoring and basic alerts
- Publish Privacy Policy and Cookie Policy
- Add cookie consent banner (non-essential cookies opt-in)

### Phase 2: Image Retention Capability
- Enable optional object storage
- Implement expiry timestamps and auto-delete policy
- Validate deletion workflow end-to-end

### Phase 3: Production Hardening
- Load and reliability testing
- Tighten security rules and secret rotation
- Cost monitoring dashboard and monthly review
- Quarterly compliance and cookie audit

---

## 11) Manager Checklist (Quick View)

- [ ] Confirm platform combination (Vercel/Render + Render/Railway)
- [ ] Confirm database provider (Render Postgres or Railway Postgres)
- [ ] Decide if object storage is needed now or in Phase 2
- [ ] Approve retention window for person images (e.g., 3/5/7 days)
- [ ] Approve privacy policy update and consent wording
- [ ] Approve cookie policy and cookie banner behavior
- [ ] Approve budget guardrails and alert thresholds

---

## 12) Final Recommendation

For the current stage, a practical path is:
- Frontend: **Vercel** (or Render if we want single-vendor simplicity)
- Backend: **Render** (or Railway for fast iteration)
- Database: managed Postgres
- Object storage: **optional now**, enable when image retention at scale becomes a priority

This gives a low-risk launch path while keeping costs controlled and allowing us to scale image handling later.
