# Holger Coaching Portal – MVP Description & User Stories

**Version:** 1.1 (Post–MVP Launch Fixes)  
**Last updated:** January 2026

---

## Recent Updates (MVP Launch Fixes)

The following were completed before first real client launch:

- **Intake accept creates client account** – When a coach accepts an intake, the system creates a `users` row and `client_profiles` row. The client receives a welcome email instructing them to **Sign in with Google** with that email to access the portal. No separate “invite” or password setup required.
- **Coach client list shows names** – The clients list displays full names and email (from the `users` table) instead of IDs, with fallback to email or “Client #…” when name is missing.
- **Coach client detail page** – A dedicated page at `/coach/clients/:id` shows client profile (name, email, phone, goals), overview metrics (sessions, action items, resources, engagement), and tabs for sessions, action items, and resources for that client.
- **Real data deletion (GDPR)** – Clients can request account deletion from Profile. The flow permanently deletes the user and all related data (sessions, messages, action items, resources, payments, invoices, notifications, OAuth tokens) and signs the user out.
- **Landing page** – Pricing section removed; footer links updated to “Get Started” and “Features” (no dead links). Testimonials kept as placeholders.
- **Production deployment guide** – `docs/PRODUCTION_DEPLOYMENT.md` documents required environment variables (database, auth, email, payments, calendar, storage), HTTPS and OAuth setup, deployment options, and a pre-launch checklist.
- **Demo accounts** – Demo logins (e.g. coach@example.com / client@example.com) remain enabled for custom email/password only and are intended to stay live for hands-on demos to potential clients.

---

## 1. MVP Overview

The **Holger Coaching Portal** is a dual-portal web application for professional coaches and their clients. It supports the full coaching lifecycle: discovery, scheduling, sessions, action items, resources, billing, and progress tracking—with optional calendar sync, payments, email reminders, and analytics.

### 1.1 Core Value Proposition

- **For coaches:** Run your practice from one place—clients, sessions, intake, billing, and analytics—without spreadsheets or scattered tools.
- **For clients:** A single hub to see upcoming sessions, complete action items, access resources, and track their coaching journey.

### 1.2 Technology Summary

- **Frontend:** React, TypeScript, shadcn/ui, TanStack Query  
- **Backend:** Node.js, Express, PostgreSQL (Drizzle ORM)  
- **Auth:** Passport.js (Google OAuth + email/password), server-side sessions  
- **Optional integrations:** Stripe & PayPal, Google Calendar, Resend email, Google Cloud Storage

---

## 2. Feature Summary

| Area | Coach | Client |
|------|--------|--------|
| **Auth** | Sign in with Google or email/password; sign up as coach | Sign in with Google or email/password; sign up as client |
| **Dashboard** | Overview: clients, sessions, revenue, quick actions | Overview: next session, action progress, engagement score |
| **Sessions** | Create, edit, confirm; notes; messages; .ics export; calendar sync | View, confirm; prep notes; reflection; messages; sync to Google |
| **Action items** | Create, assign; view status across clients | View list; mark in progress / completed |
| **Resources** | Upload (GCS); assign to client/session or global | View and download resources |
| **Billing** | Invoices; payment history; create/send invoices | View invoices; pay (Stripe/PayPal); payment history |
| **Calendar** | N/A | Connect Google Calendar; sync sessions; export .ics |
| **Profile** | N/A | Edit profile, goals, contact; timezone; connect calendar |
| **Clients** | List clients; intake requests; accept/decline | N/A |
| **Intake** | Review and accept/decline intake forms | N/A |
| **Calculator** | Pricing calculator (packages, discounts) | N/A |
| **Analytics** | Practice metrics; revenue/sessions charts; per-client metrics | Personal progress; engagement score; activity |
| **Notifications** | In-app bell; read/clear | In-app bell; read/clear |
| **PWA** | Install prompt; offline fallback | Install prompt; offline fallback |

---

## 3. User Stories – Client

Stories are framed as: **As a client, I want … so that …** and tied to the coaching experience.

---

### 3.1 Onboarding & Access

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C1 | **Sign up** with my email and password or Google so that I can access my coaching portal without remembering another password. | Auth (email/password, Google) | Low-friction start; clients can use existing Google accounts. |
| C2 | **Sign in** quickly so that I can get to my sessions and tasks without hassle. | Auth | Consistent, familiar login (same as many apps they use). |
| C3 | **Install the app** on my phone or desktop so that I can open it like a native app and get notifications. | PWA install | Feels like “my coach’s app” and is easy to find. |

---

### 3.2 Sessions

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C4 | **See my upcoming sessions** on the dashboard so that I know when my next session is and can prepare. | Dashboard, Sessions list | Reduces no-shows and keeps coaching top of mind. |
| C5 | **Open a session** to see title, time, meeting link, and prep notes so that I arrive focused and on the same page as my coach. | Session detail | Better sessions: client comes prepared and knows where to join. |
| C6 | **Confirm** a session (when requested) so that my coach knows I’ll be there. | Session confirm | Clear commitment; coach can plan. |
| C7 | **Add a reflection** after a session so that I capture what I learned and what I’ll do before we meet again. | Session reflection | Deepens learning and gives coach insight for next session. |
| C8 | **Message my coach** in the session thread so that I can ask quick questions or share updates without email. | Session messages | Keeps context in one place and feels like continuous support. |
| C9 | **Add the session to my calendar** (download .ics or sync to Google) so that it appears in my normal calendar and I get reminders. | .ics export, Google Calendar | Fewer missed sessions; fits into client’s existing routine. |
| C10 | **Join the meeting** with one click via the meeting link so that I’m not searching for the link in emails. | Meeting link on session | Smooth transition from portal to video call. |

---

### 3.3 Action Items & Accountability

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C11 | **See all my action items** in one list with due dates so that I know what I’ve committed to. | Action items list | Central place for between-session work. |
| C12 | **Mark an item** in progress or completed so that I and my coach can see my progress. | Update status | Accountability and visible progress; coach can follow up. |
| C13 | **See my engagement score** on the dashboard so that I have a simple view of how active I am in my coaching. | Client analytics | Motivation and clarity; ties actions to “progress.” |

---

### 3.4 Resources & Support

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C14 | **See resources** my coach has shared (per session or general) so that I can revisit frameworks and handouts. | Resources list | Reinforces learning; client can use materials on their own time. |
| C15 | **Download or open** a resource so that I can use it offline or in my own tools. | Resource links/files | Practical use of coaching materials in day-to-day work. |

---

### 3.5 Billing & Payments

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C16 | **View my invoices** so that I know what I owe and what I’ve paid. | Billing, Invoices | Transparency; fewer “did I pay?” questions. |
| C17 | **Pay an invoice** by card or PayPal so that I can settle up without writing checks or sending bank details. | Checkout (Stripe/PayPal) | Convenient, secure; supports different payment preferences. |
| C18 | **See my payment history** so that I have a record for my own accounting. | Payment history | Trust and clarity; reduces back-and-forth with coach. |

---

### 3.6 Profile & Preferences

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C19 | **Update my profile** (goals, contact method) so that my coach has current context. | Client profile | Coach sees up-to-date goals and how to reach me. |
| C20 | **Set my timezone** so that session times and reminders show in my local time. | Timezone | Avoids confusion; reminders and calendar make sense. |
| C21 | **Connect my Google Calendar** so that sessions are added automatically and I see them with my other events. | Google Calendar sync | One less manual step; better alignment with their schedule. |
| C22 | **Request account deletion** so that I can exercise my right to have my data removed. | Account deletion (Profile) | Full GDPR-style deletion: account and all related data are permanently removed; session is destroyed and user is signed out. |

---

### 3.7 Notifications & Reminders

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| C23 | **Get a session reminder** by email (e.g. 24h before) so that I don’t forget. | Session reminder job | Fewer no-shows; more reliable attendance. |
| C24 | **See in-app notifications** (new session, action item, resource) so that I’m aware of updates without checking email. | Notification bell | Keeps coaching visible between sessions. |

---

## 4. User Stories – Coach

Stories are framed as: **As a coach, I want … so that …** and tied to running the practice and the coaching experience.

---

### 4.1 Onboarding & Access

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P1 | **Sign up** as a coach with email/password or Google so that I can manage my practice from one place. | Auth | Clean onboarding; no dependency on a specific platform. |
| P2 | **Sign in** securely so that only I (and my clients with their own logins) access the right data. | Auth + role | Security and separation between coach and client views. |
| P3 | **Install the portal** on my device so that I can open it quickly like an app. | PWA install | Feels like “my practice app.” |

---

### 4.2 Client Acquisition & Intake

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P4 | **Receive intake submissions** in one list so that I can review who wants to work with me. | Intake list | Single place for new leads; no lost forms. |
| P5 | **Accept or decline** an intake with notes so that I can manage capacity and record my decision. | Accept/decline, coach notes | Clear workflow; audit trail for why someone was accepted or not. |
| P6 | **Trigger a welcome flow** when I accept: system creates the client’s account and sends an email telling them to sign in with Google so that the client can access the portal immediately. | Account creation + welcome email (on accept) | Smoother handoff from inquiry to first session; no manual invite step. |

---

### 4.3 Client Management

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P7 | **See a list of my clients** so that I can see who I’m working with at a glance. | Clients list | Core view of the practice. |
| P8 | **See client identification** (name and email) in the list so that I don’t have to remember IDs. | Clients list (with user data) | Usability; matches how coaches think (“Sarah,” “James”). |
| P9 | **Open a client** to see their profile, sessions, action items, and resources so that I can prepare for sessions and follow up. | Client detail page (`/coach/clients/:id`) | One place to prepare and see history; includes overview metrics and tabs. |

---

### 4.4 Sessions

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P10 | **Create a session** for a client with title, time, duration, and meeting link so that we both have one source of truth. | Create session | Reduces email; client sees it in their portal. |
| P11 | **Edit or cancel** a session so that I can reschedule or fix mistakes. | Edit/cancel session | Flexibility when life happens. |
| P12 | **Add prep notes** (and optionally show them to the client) so that I’m prepared and the client can prepare too. | Prep notes, notes visible to client | Better session quality and alignment. |
| P13 | **Add session notes** after we meet so that I have a record and can follow up next time. | Session notes | Continuity across sessions; accountability. |
| P14 | **Message the client** in the session thread so that we can clarify logistics or follow up without leaving the portal. | Session messages | Keeps context with the session. |
| P15 | **Export a session to .ics** so that the client (or I) can add it to any calendar. | .ics export | Works even without Google Calendar. |

---

### 4.5 Action Items & Accountability

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P16 | **Create action items** for a client (with due date and description) so that we turn session insights into clear next steps. | Create action item | Core coaching tool; visible to client. |
| P17 | **See action status** across clients so that I know who’s on track and who might need a nudge. | Action items (coach view), analytics | Informs next session and outreach. |

---

### 4.6 Resources

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P18 | **Upload a resource** (document, link, etc.) and assign it to a client or session (or make it global) so that clients have materials to support their work. | Resource upload (GCS) | Reusable library; less “I’ll email you that PDF.” |
| P19 | **See which resources** I’ve shared with whom so that I don’t duplicate and can curate. | Resources list (coach) | Organization and consistency. |

---

### 4.7 Billing & Revenue

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P20 | **Create an invoice** for a client with amount and line items so that I can bill clearly and professionally. | Create invoice | Professional impression; less manual invoicing. |
| P21 | **Send or mark** an invoice so that the client sees what to pay. | Invoice status (sent, paid) | Clear billing workflow. |
| P22 | **See payment history** (Stripe, PayPal, etc.) so that I know what’s been paid and can reconcile. | Coach payments list | Revenue visibility; fewer “did they pay?” checks. |
| P23 | **Use a pricing calculator** (hourly rate, packages, discounts) so that I can quote consistently. | Pricing calculator | Consistency and confidence in pricing. |

---

### 4.8 Analytics & Practice Health

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P24 | **See practice metrics** (active clients, sessions completed, revenue) on the dashboard so that I know how my practice is doing. | Coach dashboard, Analytics | High-level health of the practice. |
| P25 | **View revenue over time** (e.g. by month) so that I can spot trends and plan. | Analytics – revenue | Business insight without spreadsheets. |
| P26 | **View session trends** (completed, scheduled, cancelled) so that I can see delivery and no-show patterns. | Analytics – sessions | Improves scheduling and follow-up. |
| P27 | **See per-client metrics** (sessions, action completion, engagement) so that I can tailor support and spot disengagement. | Per-client analytics | Deeper than “how many sessions”; informs coaching approach. |

---

### 4.9 Notifications & Communication

| ID | User story | Feature | Coaching experience |
|----|------------|---------|----------------------|
| P28 | **Get an email** when an intake is submitted so that I can respond quickly. | Intake submitted email | Responsive first impression. |
| P29 | **See in-app notifications** (new session confirmed, payment received, etc.) so that I stay up to date without checking email. | Notification bell | Keeps the coach in the loop inside the tool. |
| P30 | **Rely on automatic session reminders** sent to clients so that I don’t have to send manual reminders. | Session reminder job | Saves time; improves attendance. |

---

## 5. How Features Add to the Coaching Experience

- **Single place for the relationship**  
  Sessions, actions, resources, messages, and billing live in one portal. Coach and client both know where to look, which reduces email and “where did we put that?” and keeps the focus on the work.

- **Accountability and visibility**  
  Action items and status (pending → in progress → completed) make commitments explicit. Engagement and progress metrics give the coach a quick read on how the client is doing and where to lean in.

- **Fewer admin frictions**  
  Session reminders, calendar sync, and one-click meeting links reduce no-shows and scheduling confusion. Invoicing and payments in the same app mean less chasing payments and fewer context switches.

- **Continuity between sessions**  
  Notes, reflections, and messages keep the thread of the coaching relationship. The coach can prepare from last time; the client can revisit resources and reflections whenever they need.

- **Professional, flexible access**  
  Auth (Google + email/password), PWA install, and optional payments (Stripe/PayPal) make the portal feel like a real product and support different client preferences and devices.

Together, these features support a **structured yet flexible** coaching experience: clear sessions and actions, support between sessions, and simple administration so both coach and client can focus on the coaching itself.

---

## 6. Deployment & Configuration

For production setup (environment variables, HTTPS, OAuth redirects, Stripe webhooks, demo accounts), see **`docs/PRODUCTION_DEPLOYMENT.md`**. It includes required and optional env vars, a pre-deployment checklist, and deployment options (e.g. Railway, Render, VPS).
