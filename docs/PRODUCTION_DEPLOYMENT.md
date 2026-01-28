# Production Deployment Guide

This guide covers everything needed to deploy Holger Coaching Portal to production.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase, Railway, or similar)
- Domain with HTTPS configured
- Google Cloud Console account (for OAuth and optional GCS)
- Resend account (for emails)
- Stripe account (optional, for payments)
- PayPal Developer account (optional, for payments)

---

## Required Environment Variables

Create a `.env` file with the following variables:

### Core Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Session Security (generate with: openssl rand -hex 32)
SESSION_SECRET=<64-character-random-hex-string>

# Application URL (no trailing slash)
APP_URL=https://yourdomain.com

# Server Port
PORT=3000
```

### Authentication (Required)

```env
# Google OAuth 2.0 (for "Sign in with Google")
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
6. Copy Client ID and Client Secret

### Email Notifications (Required)

```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Holger Coaching <noreply@yourdomain.com>
```

**Setup Steps:**
1. Sign up at [Resend](https://resend.com)
2. Verify your domain
3. Create an API key
4. Update `RESEND_FROM_EMAIL` with your verified domain

### Payment Processing (Optional)

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live
```

**Stripe Setup:**
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your live secret key from API Keys
3. Set up webhook endpoint at `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy webhook signing secret

**PayPal Setup:**
1. Go to [PayPal Developer](https://developer.paypal.com)
2. Create a Live app
3. Copy Client ID and Secret
4. Set `PAYPAL_MODE=live` for production

### Google Calendar Sync (Optional)

```env
# Google Calendar OAuth (can use same project as sign-in)
GOOGLE_CALENDAR_CLIENT_ID=your-calendar-client-id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=your-calendar-client-secret
```

**Setup Steps:**
1. In Google Cloud Console, enable Google Calendar API
2. Create separate OAuth client for calendar (or reuse sign-in client)
3. Add redirect URI: `https://yourdomain.com/api/auth/google-calendar/callback`

### File Storage (Optional)

```env
# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_BUCKET_NAME=your-bucket-name
```

---

## Pre-Deployment Checklist

### Security

- [ ] Generate unique `SESSION_SECRET` (never reuse from development)
- [ ] Remove or change demo account passwords
- [ ] Ensure `APP_URL` uses HTTPS
- [ ] Configure CORS if using separate frontend domain
- [ ] Review database connection uses SSL (`sslmode=require`)

### Database

- [ ] Run `npm run db:push` to apply schema to production database
- [ ] Verify all tables are created
- [ ] Set up database backups

### Authentication

- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Test Google sign-in flow
- [ ] Verify email domain is verified in Resend

### Payments (if enabled)

- [ ] Switch Stripe from test to live keys
- [ ] Register production webhook URL in Stripe Dashboard
- [ ] Switch PayPal from sandbox to live
- [ ] Test payment flow with small amount

### Email

- [ ] Verify sending domain in Resend
- [ ] Test email delivery (check spam folders)
- [ ] Review email templates for correct APP_URL

### Demo Accounts

The demo accounts (`coach@example.com`, `client@example.com`) will still work in production for demonstration purposes. If you want to disable them:

1. Remove their entries from the database
2. Or change their passwords to something secure

---

## Deployment Steps

### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add environment variables in Railway dashboard
# Then deploy
railway up
```

### Option 2: Render

1. Connect your GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables in dashboard
5. Deploy

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 4: VPS (Ubuntu)

```bash
# Clone repository
git clone https://github.com/your-username/Coaching-hub.git
cd Coaching-hub

# Install dependencies
npm ci

# Build
npm run build

# Apply database schema
npm run db:push

# Start with PM2
npm install -g pm2
pm2 start npm --name "coaching-portal" -- start
pm2 save
pm2 startup
```

---

## HTTPS Configuration

### Using Nginx (recommended for VPS)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Post-Deployment Verification

1. **Homepage loads**: Visit `https://yourdomain.com`
2. **Authentication works**: Try "Sign in with Google"
3. **Intake form submits**: Submit a test intake
4. **Email delivery**: Check for confirmation email
5. **Coach login**: Login as coach and accept intake
6. **Client receives email**: Verify welcome email sent
7. **Client can login**: New client signs in with Google
8. **Payments (if enabled)**: Test small payment

---

## Monitoring & Maintenance

### Health Check Endpoint

The app exposes a health check at `/api/health` (you may need to add this):

```typescript
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

### Logs

If using PM2:
```bash
pm2 logs coaching-portal
pm2 monit
```

### Database Backups

Set up automated backups in your database provider (Supabase, Railway, etc.) or use `pg_dump`:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Troubleshooting

### "Invalid callback URL" on Google Sign-in

- Check that redirect URI in Google Console exactly matches `APP_URL + /api/auth/google/callback`
- Ensure no trailing slashes mismatch

### Emails not sending

- Verify domain is confirmed in Resend
- Check API key is correct
- Review server logs for errors

### Session not persisting

- Ensure `SESSION_SECRET` is set
- Check that cookies are being set with `secure: true` for HTTPS
- Verify `trust proxy` is set if behind a reverse proxy

### Database connection errors

- Verify `DATABASE_URL` is correct
- Check SSL mode (`?sslmode=require`)
- Ensure IP is whitelisted in database firewall

---

## Support

For issues or questions, check:
- GitHub Issues
- Application logs
- Database connection status
