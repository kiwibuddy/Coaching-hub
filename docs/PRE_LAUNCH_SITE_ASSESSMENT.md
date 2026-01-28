# Pre-Launch Site Assessment – Holger Coaching Portal

**Purpose:** Identify what is needed before sending the portal to your first real client.  
**Scope:** Full application (auth, coach portal, client portal, payments, calendar, email, PWA, analytics).  
**Date:** January 2026

---

## Executive Summary

The MVP is **feature-complete** for core coaching workflows: sessions, action items, resources, billing, calendar sync, session reminders, and analytics. To use it with a **first real client** you should:

1. **Fix a few high-impact gaps** (intake accept → create client account, coach client list names, optional: client detail page and data deletion).
2. **Lock down production config** (HTTPS, production `APP_URL`, strong `SESSION_SECRET`, no demo secrets).
3. **Enable and test** the services you’ll use (email, payments, optional calendar and file storage).
4. **Do a focused test run** as coach + client (one full cycle from intake to session to payment).

Until then, the app is suitable for **internal/pilot use**; for a paying first client, address at least the **Must-fix** items and the **Production checklist**.

---

## 1. What’s Ready for Use

| Area | Status | Notes |
|------|--------|--------|
| **Authentication** | ✅ Ready | Google OAuth + email/password; sessions in DB; role-based redirect. |
| **Coach dashboard** | ✅ Ready | Overview, clients list, sessions, intake, resources, calculator, billing, analytics. |
| **Client dashboard** | ✅ Ready | Overview, sessions, actions, resources, profile, billing, engagement score. |
| **Sessions (CRUD)** | ✅ Ready | Create, edit, confirm, notes, reflection, messages; .ics export. |
| **Action items** | ✅ Ready | Create, list, update status; coach and client views. |
| **Resources** | ✅ Ready | Upload (GCS), list by client/session/global; metadata in DB. |
| **Payments** | ✅ Ready | Stripe Checkout + PayPal; invoices; coach/clients billing pages; webhooks. |
| **Google Calendar** | ✅ Ready | OAuth, sync session to calendar, disconnect; client profile + session detail. |
| **Email** | ✅ Ready | Resend; templates for intake, account created, session scheduled, reminder, action items, cancellation, payment. |
| **Session reminders** | ✅ Ready | Hourly job finds sessions in next 24h and sends reminder email. |
| **Analytics** | ✅ Ready | Coach: overview, revenue, sessions trend, per-client; Client: progress, engagement, activity. |
| **Notifications** | ✅ Ready | In-app bell; types used across app. |
| **PWA** | ✅ Ready | Service worker, offline page, install prompt. |
| **Intake form** | ✅ Ready | Public form; coach sees list; accept/decline with notes. |

---

## 2. Must-Fix Before First Real Client

These directly affect whether you can onboard and serve a real client smoothly.

### 2.1 Intake Accept Does Not Create Client Account

**Issue:** Accepting an intake only updates status and sends email. It does **not** create a `users` row or `client_profiles` row, so the client cannot log in until an account is created some other way.

**Impact:** You cannot send an accepted client “log in here” until you manually create their account (or build this step).

**Recommendation:** On accept:

- Create a `users` row (email from intake; role `client`; no password or temporary password).
- Create a `client_profiles` row linked to that user.
- Send “account created” email with sign-in link (and “set password” link if you use invite flow).

**Where:** Intake accept handler (e.g. PATCH intake in `server/routes.ts`); call auth storage + profile creation and existing `accountCreatedEmail`.

---

### 2.2 Coach Client List Shows IDs Instead of Names

**Issue:** Coach Clients list shows “Client #&lt;id slice&gt;” instead of the client’s name (e.g. from `users.firstName`, `users.lastName`, or email).

**Impact:** Hard to know who is who when you have more than one client.

**Recommendation:** Extend the API that returns clients (e.g. `/api/coach/clients`) to join with `users` and return display name (or firstName/lastName/email). Use that in the clients table and anywhere else you list clients by “name.”

---

### 2.3 Production Configuration and Security

**Issue:** App may still be running with local defaults (e.g. `APP_URL=http://localhost:3000`, weak or default `SESSION_SECRET`, demo DB or keys).

**Impact:** Cookies/OAuth break in production; session or account takeover risk if secrets are weak or exposed.

**Recommendation:**

- Use **HTTPS** in production (required for secure cookies and OAuth).
- Set **APP_URL** to your production URL (e.g. `https://yourdomain.com`).
- Set **SESSION_SECRET** to a long, random value (e.g. 32+ bytes hex); never commit it.
- Use **production** Stripe/PayPal keys and webhook URLs when going live.
- Restrict **DATABASE_URL** and all secrets to server env; never in frontend or repo.

---

## 3. Should-Fix (Strongly Recommended)

Important for professionalism and day-to-day use; can be done in parallel or immediately after must-fix.

### 3.1 Coach Client Detail Page

**Issue:** There is a clients list but no dedicated coach view for “one client” (profile, sessions, actions, resources together). If there’s a “View” link, it may point to a route that doesn’t exist or doesn’t show full detail.

**Impact:** Coach has to jump between Sessions, Actions, Resources to get the full picture for one client.

**Recommendation:** Add route `/coach/clients/:id` and a page that loads one client’s profile + their sessions, action items, and resources (same APIs you already have, filtered by client id).

---

### 3.2 Data Deletion (GDPR-Aligned)

**Issue:** “Request account deletion” in client profile only returns a success message; it does **not** delete or anonymize user/client data.

**Impact:** You cannot fully comply with “right to erasure” or similar requests without manual DB work.

**Recommendation:** Implement a real flow, e.g.:

- “Request deletion” creates a ticket or flags the account (current behavior is ok as first step), **and/or**
- Admin/coach action or verified flow that: deletes (or anonymizes) `users`, `client_profiles`, and cascades or clears related rows (sessions, actions, resources, messages, notifications, payments/invoices if policy allows). Document retention where you must keep data (e.g. tax).

---

### 3.3 Demo Data and Demo Accounts

**Issue:** Seed creates `coach@example.com` and `client@example.com` with rich demo data. If the same DB is used in production, those accounts remain unless removed or disabled.

**Impact:** Risk of accidental sign-in as “Demo Coach/Client” in production; demo data can confuse real use.

**Recommendation:**

- **Production:** Don’t run `npm run db:seed` on production, or use a separate “demo” environment.
- Optionally add a `DISABLE_DEMO_LOGIN=true` or env-based check that blocks login for `*@example.com` in production.
- Or delete/disable demo users after creating your real coach account.

---

### 3.4 Landing Page and Copy

**Issue:** Landing page (features, testimonials, pricing) is largely hardcoded. Testimonials and pricing are not from DB.

**Impact:** For first client you can leave as-is; for scaling, you’ll want updatable copy and possibly testimonials from DB.

**Recommendation:** Before first client: quick pass to ensure **contact / CTA and sign-in** point to the right place and that **pricing** (if shown) matches what you’ll charge. Later: testimonials from DB and config-driven pricing if desired.

---

## 4. Optional Improvements (Can Follow Launch)

- **Testimonials from DB:** Use existing `testimonials` table; public API + simple coach/admin UI to mark published.
- **Pricing from config/DB:** So you can change tiers without code deploy.
- **Lighthouse / a11y:** Run Lighthouse and fix critical a11y/performance issues (PRD mentioned 90+ and zero critical a11y).
- **Email coverage:** Trigger emails for “action item assigned,” “action due tomorrow,” “session cancelled,” “payment received” where not yet wired (templates exist in `server/lib/email.ts`).
- **Stripe webhook:** Ensure production webhook URL is registered in Stripe and that `STRIPE_WEBHOOK_SECRET` is set so paid invoices update correctly.

---

## 5. Production Deployment Checklist

Use this before pointing the first client to the live app.

### 5.1 Environment and Security

- [ ] **HTTPS** only (no HTTP in production).
- [ ] **APP_URL** set to production URL (e.g. `https://app.yourdomain.com`).
- [ ] **SESSION_SECRET** unique, long, random; not from .env.example.
- [ ] **DATABASE_URL** points to production DB (e.g. Supabase prod); credentials not in repo.
- [ ] **Demo/logins:** Demo users removed or disabled in prod DB, or `DISABLE_DEMO_LOGIN` implemented.

### 5.2 OAuth and External Services

- [ ] **Google OAuth:** Production redirect URI added in Google Cloud Console (e.g. `https://yourdomain.com/api/auth/google/callback`).
- [ ] **Google Calendar (if used):** Same or separate OAuth client; production callback URL set.
- [ ] **Stripe:** Live keys in env; webhook endpoint `https://yourdomain.com/api/webhooks/stripe` created; `STRIPE_WEBHOOK_SECRET` set.
- [ ] **PayPal (if used):** Production client ID/secret and mode; return/cancel URLs use production domain.

### 5.3 Email and Files

- [ ] **Resend:** Production API key and FROM address; domain verified if required.
- [ ] **GCS (if used):** Service account or key for prod bucket; CORS and permissions correct for uploads.

### 5.4 Application

- [ ] **Build:** `npm run build` succeeds.
- [ ] **DB schema:** `npm run db:push` (or migrations) run against production DB once; no seed.
- [ ] **Port:** Server listens on correct port; reverse proxy (e.g. Nginx) points to it and handles SSL.

### 5.5 Smoke Test (As Coach and Client)

- [ ] Sign up / sign in as **coach** (Google and/or email).
- [ ] Submit **intake** as new “client” (different browser or incognito).
- [ ] **Accept** intake (and confirm client account exists and can log in if you implemented 2.1).
- [ ] As coach: **create session** for that client; add **action item**; **upload resource**; create **invoice**.
- [ ] As client: **sign in**, see session, confirm, add reflection, **mark action** done, **pay invoice** (test mode), check **billing** and **profile**.
- [ ] Optional: **Google Calendar** connect and session sync; **session reminder** (e.g. create session 23h ahead and wait for job or trigger once).

---

## 6. Summary: Before First Real Client

| Priority | Item | Effort (rough) |
|----------|------|-----------------|
| **Must** | Intake accept → create user + client profile | Small (backend + email) |
| **Must** | Coach client list: show client names | Small (API + frontend) |
| **Must** | Production config (HTTPS, APP_URL, SESSION_SECRET, no demo in prod) | Small (ops/config) |
| **Should** | Coach client detail page (`/coach/clients/:id`) | Small–medium (one new page + API reuse) |
| **Should** | Real data deletion flow (or documented manual process) | Medium (backend + policy) |
| **Should** | Demo users disabled or removed in production | Small |
| **Optional** | Landing copy/pricing accuracy, testimonials from DB, a11y/Lighthouse | As needed |

Once the **must-fix** items and the **production checklist** are done, you can reasonably onboard your first real client and run a full cycle (intake → accept → session → action items → billing) with the current feature set. The **should-fix** items will make daily use and compliance smoother and are recommended soon after.
