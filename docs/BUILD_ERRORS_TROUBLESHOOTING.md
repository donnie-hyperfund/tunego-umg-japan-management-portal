# Build Errors Troubleshooting Guide

## Common Vercel Build Errors & Solutions

### 1. Missing Environment Variables

**Error:** `DATABASE_URL environment variable is not set`

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon database connection string
3. Make sure it's enabled for **Production**, **Preview**, and **Development**
4. Redeploy

**Error:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set` or Clerk-related errors

**Solution:**
1. Add both Clerk keys to Vercel environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
2. Ensure they're enabled for all environments
3. Redeploy

### 2. Next.js Security Vulnerability Warning

**Warning:** `npm warn deprecated next@15.5.3: This version has a security vulnerability`

**Solution:**
```bash
# Update package.json to use patched version
npm install next@latest

# Or update to specific patched version
npm install next@15.5.4
```

Then commit and push:
```bash
git add package.json package-lock.json
git commit -m "Update Next.js to fix security vulnerability"
git push origin main
```

### 3. TypeScript Build Errors

**Error:** Type errors during build

**Solution:**
1. Check build logs for specific TypeScript errors
2. Run locally to catch errors:
   ```bash
   npm run build
   ```
3. Fix TypeScript errors before pushing

### 4. ESLint Errors During Build

**Error:** ESLint errors causing build to fail

**Current config:** `eslint.ignoreDuringBuilds: false` in `next.config.ts`

**Solution Option A:** Temporarily ignore during builds (not recommended):
```typescript
// next.config.ts
eslint: {
  ignoreDuringBuilds: true,
}
```

**Solution Option B:** Fix ESLint errors:
```bash
npm run lint
# Fix all errors, then rebuild
```

### 5. Module Resolution Errors

**Error:** `Cannot find module` or import errors

**Solution:**
1. Check that all imports use correct paths
2. Verify `tsconfig.json` paths are correct:
   ```json
   "paths": {
     "@/*": ["./src/*"]
   }
   ```
3. Ensure all dependencies are in `package.json`

### 6. Database Connection During Build

**Error:** Database connection errors during build

**Note:** The code has been updated to only check `DATABASE_URL` at runtime, not during build. However, if you're running migrations during build:

**Solution:**
- Don't run migrations during build (recommended)
- Or ensure `DATABASE_URL` is set in Vercel environment variables
- Or use a build command that skips migrations:
  ```bash
  next build
  ```
  Instead of:
  ```bash
  npm run db:push && next build
  ```

### 7. Missing Dependencies

**Error:** `Module not found` or missing packages

**Solution:**
1. Ensure `package-lock.json` is committed
2. Check that all dependencies are listed in `package.json`
3. Try:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   git add package-lock.json
   git commit -m "Update dependencies"
   git push
   ```

### 8. Leaflet/Map Library Errors

**Error:** Issues with Leaflet or react-leaflet

**Solution:**
- These libraries require client-side only rendering
- Check that dynamic imports are used (already done in EventsManager.tsx)
- Ensure `ssr: false` is set for map components

## How to Get Full Error Logs

1. **In Vercel Dashboard:**
   - Go to Deployments
   - Click on the failed deployment
   - Scroll down to see full build logs
   - Look for red error messages

2. **Via Vercel CLI:**
   ```bash
   vercel logs [deployment-url]
   ```

3. **Test Locally:**
   ```bash
   # Set environment variables
   export DATABASE_URL="your-db-url"
   export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-key"
   export CLERK_SECRET_KEY="your-secret"
   
   # Run build
   npm run build
   ```

## Quick Fix Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Vercel
- [ ] `DATABASE_URL` is set (even if not used during build)
- [ ] Clerk keys are set
- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All dependencies are installed (`npm install`)
- [ ] `package-lock.json` is committed

## Getting Help

If build still fails:

1. **Copy the full error message** from Vercel build logs
2. **Check the specific error** - look for:
   - File name and line number
   - Error type (TypeScript, ESLint, Module not found, etc.)
   - Stack trace
3. **Test locally** with the same environment variables
4. **Check Vercel status**: https://www.vercel-status.com/

## Common Error Patterns

### Pattern: "Error: X is not defined"
- Usually means missing environment variable or import

### Pattern: "Cannot find module '@/...'"
- Check `tsconfig.json` paths configuration
- Verify file exists at that path

### Pattern: "Type error: Property X does not exist"
- TypeScript type error - check types and fix

### Pattern: "Build failed: Command exited with code 1"
- Look earlier in logs for the actual error
- Usually TypeScript, ESLint, or missing dependency
