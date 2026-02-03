# Vercel Deployment Guide

This guide walks you through deploying the TuneGO Management Portal to Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- A GitHub, GitLab, or Bitbucket account (for connecting your repository)
- Your project pushed to a Git repository

## Step 1: Prepare Your Repository

1. **Ensure your code is committed and pushed to your Git repository:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify your `.gitignore` includes:**
   - `.env.local`
   - `.env`
   - `node_modules/`
   - `.next/`
   - `drizzle/` (if you don't want to commit migrations)

## Step 2: Create a Vercel Project

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository:
   - Connect your Git provider (GitHub/GitLab/Bitbucket) if not already connected
   - Select your repository: `tunego-management-portal`
   - Click **"Import"**

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (for first deployment)
   - Project name? `tunego-management-portal` (or your preferred name)
   - Directory? `./` (current directory)
   - Override settings? **No**

## Step 3: Configure Environment Variables

**Critical:** You must set all environment variables in Vercel before deployment.

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

#### Required Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Getting Your Clerk Keys:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### Getting Your Database URL:

1. Go to your [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection String** → `DATABASE_URL`
   - Make sure to use the **HTTP** connection string (not WebSocket) for serverless compatibility

### Setting Environment Variables:

**For all environments (Production, Preview, Development):**
- Click **"Add New"**
- Enter the variable name and value
- Select all environments: ☑ Production ☑ Preview ☑ Development
- Click **"Save"**

**Or via Vercel CLI:**
```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add DATABASE_URL
```

## Step 4: Configure Clerk for Production

1. **Add Vercel URL to Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your application
   - Go to **Domains** or **Settings** → **Domains**
   - Add your Vercel deployment URL:
     - Production: `https://your-project.vercel.app`
     - Preview URLs: `https://your-project-*.vercel.app` (wildcard)

2. **Update Clerk Sign-in/Sign-up URLs (if needed):**
   - In Clerk Dashboard → **Paths**
   - Ensure paths match your app:
     - Sign-in: `/sign-in`
     - Sign-up: `/sign-up`

## Step 5: Configure Build Settings

Vercel should auto-detect Next.js, but verify:

1. Go to **Settings** → **General**
2. Verify:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
   - **Node.js Version:** 18.x or 20.x (recommended)

## Step 6: Run Database Migrations

Before your first deployment, ensure your database schema is up to date:

### Option A: Run migrations locally before deploying

```bash
# Make sure DATABASE_URL in .env.local points to your production database
npm run db:push
```

### Option B: Run migrations via Vercel Build Command

1. Go to **Settings** → **General** → **Build & Development Settings**
2. Update **Build Command** to:
   ```bash
   npm run db:push && next build
   ```
   
   **Note:** This requires `DATABASE_URL` to be set in Vercel environment variables.

### Option C: Use a separate migration step

Create a GitHub Action or use Vercel's deployment hooks to run migrations separately.

## Step 7: Deploy

### Via Dashboard:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment (or push a new commit)
3. Wait for build to complete

### Via Git Push:
```bash
git push origin main
```
Vercel will automatically trigger a new deployment.

### Via CLI:
```bash
vercel --prod
```

## Step 8: Verify Deployment

1. **Check deployment status:**
   - Go to **Deployments** tab
   - Ensure build succeeded (green checkmark)

2. **Test your application:**
   - Visit your deployment URL: `https://your-project.vercel.app`
   - Test sign-in/sign-up flow
   - Verify database connections work
   - Test API routes

3. **Check build logs:**
   - Click on the deployment
   - Review **Build Logs** for any warnings or errors

## Step 9: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Clerk domains to include your custom domain

## Troubleshooting

### Build Fails

**Error: "DATABASE_URL environment variable is not set"**
- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check that it's enabled for the correct environment (Production/Preview/Development)

**Error: "Clerk authentication failed"**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set
- Ensure your Vercel URL is added to Clerk's allowed domains
- Check that Clerk keys match your Clerk application

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is correct
- Ensure you're using the HTTP connection string (not WebSocket)
- Check that your Neon database allows connections from Vercel's IPs
- Verify SSL mode is enabled: `?sslmode=require`

### Runtime Errors

**API routes return 500 errors:**
- Check **Functions** tab in Vercel dashboard for error logs
- Verify environment variables are set correctly
- Check database connection string format

**Authentication not working:**
- Verify Clerk keys are correct
- Check Clerk dashboard for allowed domains
- Ensure middleware is configured correctly

### Database Migrations

**Schema out of sync:**
- Run `npm run db:push` locally pointing to production database
- Or add migration step to build process
- Consider using Drizzle migrations in CI/CD pipeline

## Environment-Specific Configuration

### Production Environment
- Use production Clerk keys (`pk_live_...`, `sk_live_...`)
- Use production database URL
- Set `NODE_ENV=production` (auto-set by Vercel)

### Preview Environment
- Can use test Clerk keys
- Can use staging database
- Automatically created for pull requests

### Development Environment
- Use local `.env.local` file
- Use development database
- Run `npm run dev` locally

## Additional Configuration

### Vercel Configuration File (Optional)

Create `vercel.json` in project root for advanced configuration:

```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Performance Optimization

- **Edge Functions:** Consider using Edge Runtime for API routes if applicable
- **Image Optimization:** Already configured with `unoptimized: true` in `next.config.ts`
- **Caching:** Vercel handles Next.js caching automatically

## Monitoring & Analytics

1. **Vercel Analytics:**
   - Go to **Analytics** tab
   - Enable Web Analytics (if needed)

2. **Error Tracking:**
   - Check **Functions** tab for runtime errors
   - Consider integrating Sentry or similar for error tracking

3. **Performance:**
   - Monitor **Speed Insights** in Vercel dashboard
   - Review Core Web Vitals

## Security Checklist

- ✅ Environment variables are set (not hardcoded)
- ✅ Clerk keys are production keys (not test keys in production)
- ✅ Database URL uses SSL (`?sslmode=require`)
- ✅ API routes are protected by Clerk middleware
- ✅ No sensitive data in client-side code
- ✅ `.env.local` is in `.gitignore`

## Next Steps

After successful deployment:

1. **Set up monitoring:** Configure error tracking and analytics
2. **Set up CI/CD:** Configure branch protection and auto-deployments
3. **Backup strategy:** Set up database backups in Neon
4. **Documentation:** Update team documentation with deployment URL

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Clerk Deployment:** https://clerk.com/docs/deployments/overview
- **Neon Serverless:** https://neon.tech/docs/serverless
