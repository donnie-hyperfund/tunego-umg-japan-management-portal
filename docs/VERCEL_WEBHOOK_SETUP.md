# Vercel Webhook Configuration Guide

## What Are Webhooks?

Webhooks allow Vercel to automatically notify your application when deployments change status (building → ready, error, etc.). This enables real-time status updates in your management portal without polling.

## How It Works

1. **Your App** has a webhook endpoint: `/api/webhooks/vercel` (already created ✅)
2. **Vercel** sends HTTP POST requests to this endpoint when deployment events occur
3. **Your App** receives the webhook and updates the database with the new status

## Step-by-Step Configuration

### Option 1: Configure Webhook Per Project (Recommended)

When you deploy a campaign site, configure the webhook for that specific Vercel project:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find the project that was created for your campaign site (e.g., `king-and-prince-2025`)

2. **Navigate to Project Settings:**
   - Click on the project name
   - Go to **Settings** tab (top navigation)

3. **Go to Webhooks Section:**
   - In the left sidebar, click **"Webhooks"**
   - Or scroll down to find the Webhooks section

4. **Add a New Webhook:**
   - Click **"Create Webhook"** or **"Add Webhook"**
   - **URL:** Enter your webhook endpoint URL:
     ```
     https://your-domain.com/api/webhooks/vercel
     ```
     - For local development: `http://localhost:3000/api/webhooks/vercel` (use ngrok or similar for testing)
     - For production: `https://your-production-domain.com/api/webhooks/vercel`
   
   - **Events:** Select the following events:
     - ✅ `deployment.created`
     - ✅ `deployment.ready` (or `deployment.succeeded`)
     - ✅ `deployment.error` (or `deployment.failed`)
     - ✅ `deployment.canceled`
   
   - **Secret (Optional but Recommended):**
     - Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
     - Add it to your `.env.local` as `VERCEL_WEBHOOK_SECRET`
     - Enter the same secret in Vercel's webhook configuration

5. **Save the Webhook:**
   - Click **"Create"** or **"Save"**

### Option 2: Configure Webhook at Account Level (Alternative)

You can also configure webhooks at the account level to apply to all projects:

1. **Go to Vercel Account Settings:**
   - Visit: https://vercel.com/account
   - Click **"Webhooks"** in the left sidebar

2. **Add Webhook:**
   - Follow the same steps as above
   - This webhook will receive events from all projects in your account

## Testing the Webhook

### Test Locally (Development)

1. **Use ngrok or similar tool:**
   ```bash
   # Install ngrok (if not installed)
   npm install -g ngrok
   
   # Start your dev server
   npm run dev
   
   # In another terminal, expose localhost
   ngrok http 3000
   ```

2. **Use the ngrok URL in Vercel:**
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Configure webhook in Vercel: `https://abc123.ngrok.io/api/webhooks/vercel`

3. **Trigger a deployment:**
   - Deploy a site from your portal
   - Check your terminal/console for webhook logs

### Test in Production

1. **Deploy your management portal to Vercel**
2. **Get your production URL** (e.g., `https://tunego-portal.vercel.app`)
3. **Configure webhook in Vercel:** `https://tunego-portal.vercel.app/api/webhooks/vercel`
4. **Deploy a campaign site** and watch for status updates

## Verifying Webhook is Working

1. **Check Webhook Logs in Vercel:**
   - Go to your project → Settings → Webhooks
   - Click on your webhook
   - View "Recent Deliveries" to see if requests are being sent

2. **Check Your App Logs:**
   - Look for webhook requests in your server logs
   - Check database to see if `deploymentStatus` is updating

3. **Test Deployment:**
   - Create a new site in your portal
   - Deploy it
   - Watch the deployment status change from "building" → "ready"

## Troubleshooting

### Webhook Not Receiving Events

1. **Check URL is correct:**
   - Must be publicly accessible (not localhost in production)
   - Must include `/api/webhooks/vercel` path
   - Must use HTTPS in production

2. **Check Events Selected:**
   - Make sure you selected the right events in Vercel
   - `deployment.ready` is the most important one

3. **Check Webhook Secret:**
   - If using a secret, make sure it matches in both places
   - Check `VERCEL_WEBHOOK_SECRET` in your `.env.local`

4. **Check Vercel Webhook Logs:**
   - Go to Vercel Dashboard → Project → Settings → Webhooks
   - Click on your webhook to see delivery status
   - Check for error responses

### Common Errors

**404 Not Found:**
- Webhook URL is incorrect
- Route doesn't exist in your app
- Check that `/api/webhooks/vercel/route.ts` exists

**401 Unauthorized:**
- Webhook secret mismatch
- Check `VERCEL_WEBHOOK_SECRET` matches

**500 Internal Server Error:**
- Check your server logs
- Verify database connection
- Check that the webhook handler code is working

## Important Notes

- **Webhooks are optional** - Your deployment will still work without them, but status updates will be manual
- **Each Vercel project needs its own webhook** (if using project-level webhooks)
- **Webhook URL must be publicly accessible** - Use ngrok for local testing
- **HTTPS required in production** - Vercel requires HTTPS for webhook URLs

## Quick Reference

**Webhook Endpoint in Your App:**
- File: `src/app/api/webhooks/vercel/route.ts` ✅ (already created)
- URL: `https://your-domain.com/api/webhooks/vercel`

**Configure in Vercel:**
- Dashboard → Project → Settings → Webhooks → Create Webhook

**Required Events:**
- `deployment.created`
- `deployment.ready`
- `deployment.error`
- `deployment.canceled`
