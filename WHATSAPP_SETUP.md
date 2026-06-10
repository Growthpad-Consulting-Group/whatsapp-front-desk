# WhatsApp Business API Setup Guide

> App deployed at: **https://whatsapp-front-desk.vercel.app**
> Supabase migrations: ✅ Done and applied

---

## Status Checklist

| Step | Task | Status |
|------|------|--------|
| 1 | Meta Developer Account | ❌ |
| 2 | Meta Business Account | ❌ |
| 3 | Create Meta App | ❌ |
| 4 | Add WhatsApp to app | ❌ |
| 5 | Get Phone Number ID + test number | ❌ |
| 6 | Generate permanent system user token | ❌ |
| 7 | Configure webhook | ❌ |
| 8 | Subscribe to `messages` webhook field | ❌ |
| 9 | Add production phone number | ❌ |
| 10 | Set app to Live mode | ❌ |
| 11 | End-to-end test | ❌ |

---

## Step 1 — Create a Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Log in with a personal Facebook account (this becomes the admin)
3. Click **Get Started** → verify your account if prompted

---

## Step 2 — Create a Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create a business — use the client's real business name
3. This is separate from a personal Facebook page

---

## Step 3 — Create a Meta App

1. developers.facebook.com → **My Apps** → **Create App**
2. Use case: **Other** → Next
3. App type: **Business** → Next
4. App name (e.g. "GCG WhatsApp Bot"), contact email, link to your Business Account
5. Click **Create App**

---

## Step 4 — Add WhatsApp to the App

1. In your app dashboard scroll down to **WhatsApp** → **Set Up**
2. Select your Meta Business Account → **Continue**
3. You land on **WhatsApp → Getting Started**

---

## Step 5 — Get the Test Phone Number

Meta provides a free test number immediately:

1. On Getting Started you'll see a **From** test number (already there)
2. In the **To** field, enter your personal WhatsApp number → **Send Message**
3. You should receive a test message — confirms the connection works
4. Note down the **Phone Number ID** shown on this page

---

## Step 6 — Generate a Permanent Access Token

> ⚠️ The temporary token on Getting Started expires in 24 hours. Use a system user token instead.

1. Go to [business.facebook.com](https://business.facebook.com) → **Settings**
2. **Users** → **System Users** → **Add**
3. Name: `whatsapp-bot`, Role: **Admin**
4. Click **Generate New Token** → select your app → enable:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the token — **save it now**, it will not show again

Add to Vercel environment variables:
```
WHATSAPP_TOKEN=<system_user_token>
WHATSAPP_PHONE_NUMBER_ID=<phone_number_id_from_step_5>
```

---

## Step 7 — Configure the Webhook

1. Meta developer console → your app → **WhatsApp** → **Configuration**
2. Under **Webhook** → **Edit**
3. Fill in:
   - **Callback URL**: `https://whatsapp-front-desk.vercel.app/api/webhooks/whatsapp`
   - **Verify Token**: any secret string you choose, e.g. `gcg-verify-token-2026`
4. Add the same string to Vercel env vars:
   ```
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=gcg-verify-token-2026
   ```
5. Click **Verify and Save**

> If verification fails: make sure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` is deployed in Vercel and the deployment has refreshed.

---

## Step 8 — Subscribe to Webhook Fields

1. After saving the webhook, click **Manage** next to Webhook Fields
2. Enable the **`messages`** field → **Done**

---

## Step 9 — Add a Production Phone Number

The test number only works with manually added testers. For real customers:

1. **WhatsApp → Phone Numbers → Add Phone Number**
2. Requirements for the number:
   - Must **not** be registered on a personal WhatsApp account
   - Must be able to receive an SMS or voice call for verification
   - A business landline or a new SIM works fine
3. Verify via the SMS code Meta sends
4. Update Vercel env var:
   ```
   WHATSAPP_PHONE_NUMBER_ID=<new_production_number_id>
   ```

> If the number is currently on a personal WhatsApp: go to WhatsApp → Settings → Account → Delete Account before registering it here.

---

## Step 10 — Switch App to Live Mode

In Development mode the bot only responds to accounts listed as testers on the app.

1. Top of Meta app dashboard → toggle **Development** → **Live**
2. Meta may require **Business Verification**:
   - business.facebook.com → **Security Center** → **Start Verification**
   - Upload business documents (registration certificate or utility bill)
   - Takes 1–5 business days

---

## Step 11 — End-to-End Test

1. Send "Hi" to your WhatsApp Business number from any phone
2. Check Vercel logs: dashboard → **Functions** → `/api/webhooks/whatsapp`
3. The bot should reply with the service selection menu

**If the bot does not reply, check:**
- Vercel logs for errors
- `WHATSAPP_TOKEN` is the system user token (not the expired temporary one)
- Webhook is subscribed to `messages`
- App is in Live mode (or the test device is added as a tester)

---

## All WhatsApp Environment Variables

```env
WHATSAPP_TOKEN=                   # permanent system user token from Step 6
WHATSAPP_PHONE_NUMBER_ID=         # from Meta developer console
WHATSAPP_WEBHOOK_VERIFY_TOKEN=    # your chosen secret string from Step 7
```

Add all three in: Vercel Dashboard → your project → **Settings** → **Environment Variables**

---

## What's Next After WhatsApp

| Service | Guide |
|---------|-------|
| Paystack payments | Create account → get secret key → set webhook to `/api/webhooks/paystack` |
| Google Calendar | Google Cloud Console → enable Calendar API → create OAuth credentials → add redirect URI `https://whatsapp-front-desk.vercel.app/api/auth/google/callback` |
| Cron jobs | Add `vercel.json` with cron config, or use cron-job.org to hit the 4 `/api/cron/*` routes on schedule with the `x-cron-secret` header |
