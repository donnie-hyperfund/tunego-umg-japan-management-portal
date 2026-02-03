# Clerk Setup Guide for Campaign Sites

## Architecture Overview

You have **two separate Clerk applications**:

1. **Management Portal Clerk App** - For admin/editor authentication (already configured)
2. **Campaign Sites Clerk App(s)** - For end-user authentication on deployed campaign sites

These are completely separate and should use different Clerk applications.

---

## Step 1: Create a Clerk Application for Campaign Sites

### Option A: Single Shared Clerk App (Recommended for Start)

1. **Go to Clerk Dashboard:**
   - Visit: https://dashboard.clerk.com
   - Sign in with your account

2. **Create a New Application:**
   - Click **"Create Application"** or **"Add Application"**
   - Name it: `TuneGO Campaign Sites` (or similar)
   - Choose authentication methods (Email, Social, etc.)
   - Click **"Create Application"**

3. **Get Your Keys:**
   - Go to **API Keys** in the left sidebar
   - Copy:
     - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
     - **Secret Key** (starts with `sk_test_` or `sk_live_`)

4. **Save These Keys:**
   - You'll use these as **global defaults** for campaign sites
   - Store them securely (we'll add them to environment variables)

### Option B: Per-Campaign Clerk Apps (Advanced)

If you want each campaign to have its own Clerk app:
- Create a separate Clerk app for each campaign
- Use the site-specific Clerk key fields in the site form
- More isolation but more management overhead

**Recommendation:** Start with Option A (shared app), migrate to per-campaign apps later if needed.

---

## Step 2: Set Global Default Clerk Keys (Optional)

Set these as environment variables in your **management portal** to use as defaults for all campaign sites:

### In `.env.local` (Development):

```env
# Management Portal Clerk (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Management portal keys
CLERK_SECRET_KEY=sk_test_... # Management portal keys

# Campaign Sites Default Clerk (NEW - for global defaults)
CAMPAIGN_CLERK_PUBLISHABLE_KEY=pk_test_... # Campaign sites default
CAMPAIGN_CLERK_SECRET_KEY=sk_test_... # Campaign sites default
```

### In Vercel (Production):

1. Go to your management portal project in Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - `CAMPAIGN_CLERK_PUBLISHABLE_KEY` = Your campaign Clerk publishable key
   - `CAMPAIGN_CLERK_SECRET_KEY` = Your campaign Clerk secret key

**Note:** These are different from your management portal's Clerk keys!

---

## Step 3: Update Code to Use Campaign Clerk Keys

The code needs to be updated to use `CAMPAIGN_CLERK_*` environment variables instead of the management portal's Clerk keys. Let me update the deployment route:

---

## Step 4: Database Migration

Run the migration to add the new Clerk configuration fields:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push
```

This adds:
- `enable_user_management` (boolean)
- `clerk_publishable_key` (text, nullable)
- `clerk_secret_key` (text, nullable)

---

## Step 5: Configure a Campaign Site

### When Creating/Editing a Site:

1. **Go to Site Form** (General tab)
2. **User Management Section:**
   - ✅ **Enable User Management** (checked by default)
   - **Clerk Publishable Key** (optional - leave empty to use global default)
   - **Clerk Secret Key** (optional - leave empty to use global default)

### Options:

**Option 1: Use Global Defaults (Easiest)**
- Leave Clerk key fields empty
- Site will use `CAMPAIGN_CLERK_*` environment variables

**Option 2: Use Site-Specific Keys**
- Enter Clerk keys from a campaign-specific Clerk app
- Overrides global defaults for this site only

**Option 3: Marketing-Only Site (No Auth)**
- Uncheck "Enable User Management"
- No Clerk keys needed
- Site won't include authentication

---

## Step 6: Deploy a Campaign Site

When you deploy:

1. **If User Management Enabled:**
   - Deployment route will use:
     1. Site-specific Clerk keys (if provided)
     2. Global `CAMPAIGN_CLERK_*` defaults (if site keys not provided)
     3. Management portal keys (fallback - should be avoided)
   - Clerk keys are automatically set in Vercel project environment variables

2. **If User Management Disabled:**
   - No Clerk keys needed
   - Site deploys without authentication

---

## Verification Checklist

- [ ] Created separate Clerk app for campaign sites
- [ ] Got campaign Clerk publishable and secret keys
- [ ] Added `CAMPAIGN_CLERK_PUBLISHABLE_KEY` to environment variables
- [ ] Added `CAMPAIGN_CLERK_SECRET_KEY` to environment variables
- [ ] Ran database migration (`npm run db:push`)
- [ ] Created/edited a campaign site with Clerk configuration
- [ ] Deployed a campaign site and verified Clerk works

---

## Troubleshooting

### "Missing publishableKey" Error

**Cause:** Clerk keys not set in Vercel project

**Solution:**
1. Check if site has `enableUserManagement: true`
2. Verify Clerk keys are set (site-specific or global defaults)
3. Check Vercel project → Settings → Environment Variables
4. Redeploy if needed

### Wrong Clerk App Used

**Cause:** Using management portal's Clerk keys for campaigns

**Solution:**
- Make sure you're using `CAMPAIGN_CLERK_*` environment variables
- Or set site-specific Clerk keys in the site form
- Never use management portal's Clerk keys for campaigns

### Users Can't Sign In

**Cause:** Clerk app configuration issue

**Solution:**
1. Check Clerk Dashboard → Your Campaign App → Settings
2. Verify allowed origins/redirect URLs
3. Check authentication methods enabled
4. Verify keys match between site and Clerk app

---

## Best Practices

1. **Separate Apps:** Always use different Clerk apps for management portal vs. campaigns
2. **Global Defaults:** Use `CAMPAIGN_CLERK_*` for most campaigns (easier management)
3. **Site-Specific:** Only use per-site keys if you need isolation or different branding
4. **Security:** Never commit Clerk keys to git
5. **Environment:** Use different Clerk apps for development vs. production

---

## Next Steps

After completing setup:

1. ✅ Update deployment route to use `CAMPAIGN_CLERK_*` variables
2. ✅ Test creating a site with global defaults
3. ✅ Test creating a site with site-specific keys
4. ✅ Test creating a marketing-only site (no auth)
5. ✅ Deploy and verify authentication works
