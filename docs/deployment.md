# Deployment Guide — WhatsApp Front Desk

## Prerequisites

- GitHub repo connected to Vercel
- Supabase project (free tier is fine for pilot)
- Meta WhatsApp Business account with Cloud API access
- Paystack account (Kenya)
- cron-job.org account (free)
- Google Cloud project with Calendar API enabled (for Google Calendar sync)

---

## 1. Supabase Setup

### Run migrations

In the Supabase dashboard SQL editor, run each migration file **in order**:

1. `supabase/migrations/20260519000001_initial_schema.sql`
2. `supabase/migrations/20260519000002_rls_policies.sql`
3. `supabase/migrations/20260519000003_seed_defaults.sql`
4. `supabase/migrations/20260519000004_audit_and_indexes.sql`

> **Tip:** Once you have a Supabase personal access token, you can run `npm run gen:types` to regenerate `src/types/database.ts` from the live schema.

### Auth settings

In Supabase → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/auth/callback`

In Supabase → Authentication → Email:
- Enable "Confirm email" (recommended for production)
- Optionally enable magic link

### Storage

Create a public bucket named `business-assets` for logo uploads.

---

## 2. Vercel Deployment

### Connect repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `/` (default)

### Environment variables

Add all variables from `.env.local.example` in Vercel → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret/service role key |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `WHATSAPP_PHONE_NUMBER_ID` | From Meta app dashboard |
| `WHATSAPP_ACCESS_TOKEN` | From Meta app dashboard |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Any random string you choose |
| `PAYSTACK_SECRET_KEY` | From Paystack dashboard |
| `PAYSTACK_PUBLIC_KEY` | From Paystack dashboard |
| `CRON_SECRET` | Any random string (used for cron-job.org) |
| `ENCRYPTION_SECRET` | 32+ char random string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

### Deploy

Push to `main` — Vercel deploys automatically on every push.

---

## 3. WhatsApp Webhook

### Meta app configuration

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your App → WhatsApp → Configuration
2. **Webhook URL:** `https://your-domain.vercel.app/api/webhooks/whatsapp`
3. **Verify Token:** must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your env
4. **Subscribe to:** `messages` field

### Phone number

Ensure your WhatsApp phone number is added and verified in the Meta app. Add it to the business settings in the app once signed up.

---

## 4. Paystack Webhook

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. **Webhook URL:** `https://your-domain.vercel.app/api/webhooks/paystack`
3. No additional setup needed — signature verification uses `PAYSTACK_SECRET_KEY`

---

## 5. Google Calendar OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application type)
4. **Authorized redirect URIs:** `https://your-domain.vercel.app/api/auth/google/callback`
5. Copy Client ID and Client Secret into Vercel env vars

---

## 6. Cron Jobs (cron-job.org)

Sign up at [cron-job.org](https://cron-job.org) and create three jobs:

| Title | URL | Schedule | Custom Header |
|---|---|---|---|
| WA FD — Reminders | `https://your-domain.vercel.app/api/cron/reminders` | Every 5 min | `x-cron-secret: your-secret` |
| WA FD — Overdue | `https://your-domain.vercel.app/api/cron/overdue` | Every 5 min | `x-cron-secret: your-secret` |
| WA FD — Deposits | `https://your-domain.vercel.app/api/cron/deposits` | Every 5 min | `x-cron-secret: your-secret` |

The `x-cron-secret` value must match your `CRON_SECRET` environment variable.

---

## 7. Cloudflare (DNS + Proxy)

If using a custom domain:

1. Add your domain to Cloudflare
2. In Vercel → Domains, add your custom domain
3. In Cloudflare → DNS, create a CNAME record pointing to `cname.vercel-dns.com`
4. Set Cloudflare proxy status to **Proxied** (orange cloud) for DDoS protection

---

## 8. Post-deploy checklist

- [ ] Sign up at `/signup` and complete onboarding
- [ ] Add at least one service in Settings → Services
- [ ] Set operating hours in Settings
- [ ] Test WhatsApp webhook: send a message to your WhatsApp number
- [ ] Test booking flow end to end (message → slot → confirm)
- [ ] Test reminder delivery (set an appointment 25 hours from now and wait for cron)
- [ ] Test Paystack deposit link (create a service with deposit required)
- [ ] Verify audit logs are being created in Supabase → Table Editor → audit_logs

---

## Generating updated database types

After any schema change:

```bash
# Login once (needs personal access token from supabase.com/dashboard/account/tokens)
npx supabase login --token sbp_your_token

# Link to project
npx supabase link --project-ref kxdzlmqyyctnebucpbvz

# Generate types
npm run gen:types
```
