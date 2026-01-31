# Railway: Point to Coaching-hub Repo and Database

This guide explains **what Railway is likely showing now** and **how to make Railway deploy the Coaching-hub repo** with the correct database and env so your live site matches your local Coaching-hub app (e.g. `PORT=3001 npm run dev`).

---

## What Railway Is Probably Showing Right Now

From your setup history:

| Item | Current (typical) | What you want |
|------|-------------------|----------------|
| **GitHub repo** | **Holger-Coaching-Portal** | **Coaching-hub** |
| **Code deployed** | Older repo (no coach setup, no client complete-profile, older dashboard, etc.) | Coaching-hub (onboarding, settings, themes, session detail, client detail with add action/resource, etc.) |
| **Database** | Whatever `DATABASE_URL` is set in that Railway project (often a Railway Postgres added to the same project) | A PostgreSQL database used **only** for Coaching-hub (can be the same Railway Postgres or a new one) |

So the live site is almost certainly building from **Holger-Coaching-Portal** and using that project’s env and database. To have the live app match Coaching-hub, you need to point Railway at the **Coaching-hub** repo and ensure the database and env are correct for Coaching-hub.

---

## How to Check What Railway Is Using

1. **Log in:** [railway.app](https://railway.app) → your project.
2. **Check the linked repo:**
   - Open the **service** that runs the app (e.g. “Web” or your app name).
   - Go to **Settings** (or the service’s **Source** / **GitHub** section).
   - You’ll see which **GitHub repo and branch** are connected (e.g. `YourUsername/Holger-Coaching-Portal`).
3. **Check the database:**
   - In the same project, see if there is a **PostgreSQL** service.
   - In your **app service** → **Variables**, look at **DATABASE_URL** (often a reference like `${{Postgres.DATABASE_URL}}`). That’s the DB the app is using.

Write down:
- Repo name (e.g. Holger-Coaching-Portal vs Coaching-hub).
- Whether DATABASE_URL points to a Railway Postgres or an external URL.

---

## Triggering a Fresh Deploy (Repo Already = Coaching-hub)

If Railway is **already** connected to `kiwibuddy/Coaching-hub` on the **main** branch (as in your setup), the live site only updates when Railway runs a **new deployment**. That happens when there are **new commits on `main`**.

### To get your latest Coaching-hub changes live

1. **Push your local changes to GitHub `main`:**
   ```bash
   cd /path/to/Coaching-hub
   git status
   git add .
   git commit -m "Your message"
   git push origin main
   ```
2. **Railway will auto-deploy** (with "Wait for CI" off, it deploys on push without waiting for GitHub Actions).
3. **Check that a deploy ran:** In Railway → **Coaching-hub** service → **Deployments** tab. You should see a new deployment with a recent timestamp and the commit you just pushed.
4. **If no new deployment appears:** Use **Redeploy** (or **Deploy** → **Redeploy**) on the latest deployment in the Deployments tab to force a fresh build.

So if the live site doesn’t show your recent work, it’s usually because those changes haven’t been pushed to `main` yet, or the latest deploy failed (check Deployments and Logs).

---

## Make Railway Use the Coaching-hub Repo

### Option A: Switch the existing project to Coaching-hub (recommended)

1. In Railway, open the **service** that runs the app.
2. Go to **Settings** (or **Source**).
3. Find **Connect Repo** / **Change Repo** / **GitHub**.
4. **Disconnect** the current repo (Holger-Coaching-Portal) if needed.
5. **Connect** the **Coaching-hub** repo:
   - Choose your GitHub account/org.
   - Select the **Coaching-hub** repository.
   - Select the branch to deploy (e.g. `main`).
6. Save. Railway will redeploy from Coaching-hub.

### Option B: New project for Coaching-hub

1. In Railway: **New Project**.
2. **Deploy from GitHub repo** → choose **Coaching-hub** and branch.
3. Add a **PostgreSQL** service (or use an existing external DB; see below).
4. Configure the app service (build, start, env) as in the next section.

---

## Database: Use One Dedicated to Coaching-hub

Your app needs a **PostgreSQL** database and a **DATABASE_URL** that points to it.

- **Option 1 – New Railway Postgres (simplest)**  
  - In the same project: **New** → **Database** → **PostgreSQL**.  
  - In the app service **Variables**, add or set **DATABASE_URL** to the Postgres URL (Railway often suggests `${{Postgres.DATABASE_URL}}`).  
  - This DB will be empty; run migrations and seed (see below).

- **Option 2 – Reuse existing Railway Postgres**  
  - If you already have a Postgres in this project and want to use it for Coaching-hub:  
    - Use its **DATABASE_URL** in the Coaching-hub service.  
    - If that DB was used by Holger-Coaching-Portal, run Coaching-hub migrations (and optionally seed). Be aware that sharing a DB with another app can mix data.

- **Option 3 – External Postgres (Supabase, Neon, etc.)**  
  - Create a new database for Coaching-hub.  
  - Copy its connection string and set **DATABASE_URL** in Railway to that URL (use SSL if required).

After setting **DATABASE_URL**, run schema push and seed (see “After first deploy” below).

---

## Required Environment Variables (Coaching-hub)

In Railway: open your **app service** → **Variables** (or **Settings** → **Environment**). Set at least:

| Variable | Description | Example |
|----------|-------------|--------|
| **DATABASE_URL** | PostgreSQL connection string (from Railway Postgres or external) | `postgresql://user:pass@host:5432/railway?sslmode=require` |
| **SESSION_SECRET** | Secret for session cookies (use a long random string) | e.g. `openssl rand -hex 32` |
| **APP_URL** | Full public URL of your app (no trailing slash) | `https://your-app.up.railway.app` |
| **PORT** | Port the server listens on (Railway often sets this automatically) | `3000` or leave unset if Railway injects it |

Optional but recommended for production:

- **NODE_ENV** = `production`
- **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET** (if using Google sign-in; set redirect URI to `https://your-app.up.railway.app/api/auth/google/callback`)
- **RESEND_API_KEY** / **RESEND_FROM_EMAIL** (for emails)
- **STRIPE_*** / **PAYPAL_*** (if using payments)
- **GOOGLE_CLOUD_*** or **GOOGLE_CLOUD_KEY** (if using file uploads)

Match these to what’s in Coaching-hub’s `.env.example` and `docs/PRODUCTION_DEPLOYMENT.md`.

---

## Build and Start Commands (Coaching-hub)

Railway needs to know how to build and run the app. In the app service **Settings**:

| Setting | Value (from Coaching-hub `package.json`) |
|---------|------------------------------------------|
| **Build command** | `npm run build` (or leave default if it runs `npm install` and then build) |
| **Start command** | `npm start` |
| **Root directory** | Leave blank if the repo root is the app root |

Coaching-hub uses:

- `npm run build` → `tsx script/build.ts`
- `npm start` → `NODE_ENV=production node dist/index.cjs`

If Railway doesn’t set **NODE_ENV**, add **NODE_ENV** = `production` in Variables.

---

## After First Deploy: Database Schema and Seed

Once the service is deploying from **Coaching-hub** and **DATABASE_URL** is set:

1. **Option 1 – Run from your machine (one-off)**  
   - Clone Coaching-hub, create a `.env` with the **same DATABASE_URL** as in Railway (and any other vars the scripts need).  
   - Run:
     - `npm run db:push`   # apply Drizzle schema
     - `npm run db:seed`   # seed data (optional)
   - Commit and push to Coaching-hub if anything in repo changed; Railway will redeploy.

2. **Option 2 – Railway one-off run (if supported)**  
   - Some setups allow a one-off “run” in Railway with the same env. If available, run `npm run db:push` and `npm run db:seed` there so the linked DB is set up.

3. **Option 3 – Deploy script**  
   - You can add a small script or use a release phase (if Railway supports it) to run `db:push` on deploy. Only do this if you’re comfortable with migrations running automatically.

After schema and seed, the live app should use the Coaching-hub schema and data.

---

## Quick Checklist

- [ ] Railway project uses **Coaching-hub** GitHub repo (and correct branch).
- [ ] **DATABASE_URL** points to a PostgreSQL database you intend for Coaching-hub.
- [ ] **SESSION_SECRET** and **APP_URL** are set; **APP_URL** has no trailing slash.
- [ ] Build/start commands match Coaching-hub (`npm run build`, `npm start`).
- [ ] **NODE_ENV** = `production` in production.
- [ ] Ran `npm run db:push` (and optionally `npm run db:seed`) for that **DATABASE_URL**.
- [ ] OAuth and email env vars set if you use those features; redirect/callback URLs use **APP_URL**.

---

## Summary

| Goal | Action |
|------|--------|
| **Show Coaching-hub code on the live link** | Connect the Railway service to the **Coaching-hub** GitHub repo (and correct branch). |
| **Use the right database** | Set **DATABASE_URL** in that service to the Postgres you want for Coaching-hub; run `db:push` (and optionally `db:seed`) for that DB. |
| **Avoid mixing with old app** | Prefer a dedicated DB for Coaching-hub (new Railway Postgres or new external DB). |

After this, your Railway link will serve the **Coaching-hub** app and database instead of Holger-Coaching-Portal.
