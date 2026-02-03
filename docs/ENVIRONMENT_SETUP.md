# Environment Variables Setup Guide

## Required Environment Variables

### 1. PAYLOAD_SECRET

**What it is:** A secret key used by Payload CMS for encryption and signing. It should be a long, random string.

**How to generate it:**

**Option A: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option C: Online Generator**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Add to `.env.local`:**
```env
PAYLOAD_SECRET=your-generated-secret-here-minimum-32-characters
```

**Important:** 
- Must be at least 32 characters long
- Keep it secret - never commit to git
- Use different secrets for development and production

---

### 2. BLOB_READ_WRITE_TOKEN (Vercel Blob Storage)

**What it is:** An API token for Vercel Blob Storage, used to upload and manage media files (images, videos) for campaign sites.

**How to get it:**

#### Step 1: Create a Vercel Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create one if needed)
3. Navigate to **Storage** tab (or go to https://vercel.com/dashboard/stores)
4. Click **Create Database** or **Add Storage**
5. Select **Blob** from the storage options
6. Choose a name for your blob store (e.g., `tunego-campaign-assets`)
7. Select a region (choose closest to your users)
8. Click **Create**

#### Step 2: Get the Read-Write Token

1. In your Vercel Dashboard, go to **Storage** → Your Blob Store
2. Click on **Settings** or **.env.local** tab
3. Look for **BLOB_READ_WRITE_TOKEN** or **Environment Variables**
4. Copy the token value

**Alternative Method (if token not visible):**

1. Go to your project settings in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Look for variables starting with `BLOB_` or check the Blob store settings
4. If you need to create the token:
   - Go to Vercel Dashboard → Your Project → Settings
   - Navigate to **Storage** → Your Blob Store
   - Click **Generate Token** or **Create Token**
   - Select **Read-Write** permissions
   - Copy the generated token

**Add to `.env.local`:**
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Token format: Usually starts with `vercel_blob_rw_` followed by a long string
- Keep it secret - never commit to git
- Use different tokens for development and production if needed

---

### 3. VERCEL_TOKEN (For Site Deployment)

**What it is:** An API token for Vercel, used to create projects and deploy campaign sites automatically.

**How to get it:**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/login
   - Sign in with your account

2. **Navigate to Account Settings:**
   - Click your profile icon (top right corner)
   - Select **"Settings"** from the dropdown

3. **Go to Tokens Section:**
   - In the left sidebar, click **"Tokens"**
   - Or go directly to: https://vercel.com/account/tokens

4. **Create a New Token:**
   - Click **"Create Token"** button
   - Enter a descriptive name (e.g., "TuneGO Management Portal")
   - Choose expiration:
     - **"No expiration"** (recommended for server use)
     - Or set a specific expiration date
   - Click **"Create"**

5. **Copy the Token:**
   - **Important:** Copy the token immediately - you won't be able to see it again!
   - The token will look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - If you lose it, you'll need to create a new one

**Add to `.env.local`:**
```env
VERCEL_TOKEN=your_vercel_api_token_here
```

**Important:**
- Keep it secret - never commit to git
- The token has full access to your Vercel account
- Use different tokens for development and production if needed
- If compromised, revoke it immediately and create a new one

**Optional: VERCEL_WEBHOOK_SECRET**
If you want to verify webhook signatures (recommended for production):
- This is optional but recommended for security
- You can generate a random secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Add to `.env.local`:
  ```env
  VERCEL_WEBHOOK_SECRET=your-generated-secret-here
  ```

---

### 4. DATABASE_URL (Already Configured)

You should already have this set up. If not:

1. Go to [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection String**
5. Make sure to use the **HTTP** connection string (not WebSocket) for serverless compatibility

**Add to `.env.local`:**
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

---

### 5. Clerk Keys (Already Configured)

You should already have these. If not:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

---

## Complete `.env.local` Example

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Payload CMS
PAYLOAD_SECRET=your-generated-32-character-secret-here
PAYLOAD_CONFIG_PATH=src/payload.config

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vercel API (for site deployment)
VERCEL_TOKEN=your_vercel_api_token_here
VERCEL_WEBHOOK_SECRET=optional_webhook_secret_for_verification
```

---

## Quick Setup Script

You can run this to generate a Payload secret:

```bash
# Generate Payload secret
echo "PAYLOAD_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local
```

**Note:** This appends to `.env.local`. Make sure to add the other variables manually.

---

## Verifying Setup

After adding all environment variables:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check for errors in the console - if Payload or Blob storage is misconfigured, you'll see error messages

3. Test the sites functionality:
   - Navigate to `/sites`
   - Try creating a new site
   - If asset uploads are implemented, test uploading an image

---

## Troubleshooting

### Payload Secret Issues
- **Error:** "PAYLOAD_SECRET must be at least 32 characters"
  - **Solution:** Generate a longer secret (32+ characters)

### Blob Storage Issues
- **Error:** "Invalid token" or "Unauthorized"
  - **Solution:** 
    - Verify token is correct (no extra spaces)
    - Check token has read-write permissions
    - Ensure blob store exists in your Vercel project

### Database Issues
- **Error:** "DATABASE_URL not set"
  - **Solution:** Add DATABASE_URL to `.env.local` (should already be configured)

---

## Production Setup (Vercel)

When deploying to Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add all the same variables:
   - `PAYLOAD_SECRET` (generate a new one for production)
   - `BLOB_READ_WRITE_TOKEN` (use production blob store token)
   - `DATABASE_URL` (production database URL)
   - `VERCEL_TOKEN` (your Vercel API token)
   - `VERCEL_WEBHOOK_SECRET` (optional, for webhook verification)
   - Clerk keys (production keys)
3. Redeploy your application

**Important:** Never use development secrets in production!
