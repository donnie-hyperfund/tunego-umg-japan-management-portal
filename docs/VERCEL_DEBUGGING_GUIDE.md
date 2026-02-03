# Vercel Debugging Guide

## What to Check in Vercel Dashboard

### 1. **Build Logs** (Most Important)
**Location:** Vercel Dashboard → Your Project → Deployments → Click on a deployment → "Build Logs" tab

**What to look for:**
- ✅ Build completed successfully (green checkmark)
- ❌ Any errors or warnings during build
- Check if `postcss.config.mjs` is being recognized
- Check if Tailwind CSS is processing correctly
- Look for any TypeScript/ESLint errors

**Common issues:**
- Missing `postcss.config.mjs` → Tailwind won't work
- Build errors → Code might not be deployed correctly
- Warnings about unused CSS → Might indicate Tailwind not processing

### 2. **Function Logs** (Runtime Errors)
**Location:** Vercel Dashboard → Your Project → Functions tab → Click on a function → View logs

**What to look for:**
- Runtime errors when the page loads
- Console errors from your code
- API route errors

### 3. **Deployment Source Code** (Verify What Was Deployed)
**Location:** Vercel Dashboard → Your Project → Deployments → Click on deployment → "Source" tab

**What to check:**
- Open `src/app/page.tsx` and verify:
  - ✅ Contains `z-0` on video background
  - ✅ Contains `z-10` on main content
  - ✅ Contains button code (look for "CTA Button" comment)
  - ✅ Contains `overflow-hidden` on root div
  - ✅ Contains inline styles we added

### 4. **Environment Variables**
**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

**What to check:**
- All required variables are set
- Variables are enabled for the correct environment (Production/Preview)

### 5. **Build Configuration**
**Location:** Vercel Dashboard → Your Project → Settings → General → Build & Development Settings

**What to check:**
- Build Command: `npm run build` (or custom)
- Install Command: `npm install`
- Output Directory: `.next` (default for Next.js)

### 6. **Network Tab** (Browser DevTools)
**What to check:**
- Open deployed site → Open DevTools → Network tab
- Check if `globals.css` is loading (should be a CSS file)
- Check if CSS file contains Tailwind classes (search for `.z-0`, `.z-10`, etc.)
- Check for 404 errors on CSS files

### 7. **Console Tab** (Browser DevTools)
**What to check:**
- Open deployed site → Open DevTools → Console tab
- Look for JavaScript errors
- Look for React hydration errors
- Check if components are rendering

## Quick Debugging Checklist

When debugging deployed site issues:

1. ✅ **Check Build Logs** - Did the build succeed?
2. ✅ **Check Source Code** - Is the correct code deployed?
3. ✅ **Check Browser Console** - Any JavaScript errors?
4. ✅ **Check Network Tab** - Is CSS loading?
5. ✅ **Check Function Logs** - Any runtime errors?
6. ✅ **Hard Refresh** - Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
7. ✅ **Check Preview Endpoint** - Compare generated code vs deployed code

## Common Issues & Solutions

### Issue: Button Not Showing
**Check:**
- Browser console for errors
- Verify button code exists in deployed source
- Check if `heroContent.ctaText` and `heroContent.ctaLink` have values
- Check CSS - button might be there but invisible (wrong color, hidden, etc.)

### Issue: Text Styling Wrong
**Check:**
- Is Tailwind CSS loading? (Network tab)
- Are Tailwind classes in the CSS file? (Search for `.text-white`, `.text-4xl`, etc.)
- Check if `postcss.config.mjs` exists in deployment
- Check build logs for PostCSS/Tailwind errors

### Issue: Video Background Not Working
**Check:**
- Is video URL accessible? (Check Network tab)
- Check z-index in browser DevTools (Elements tab → Computed styles)
- Verify `position: fixed` is applied
- Check if video element is rendering (Elements tab)

## Getting Help

When reporting issues, include:
1. Screenshot of the problem
2. Browser console errors (if any)
3. Build logs from Vercel
4. Source code from deployed site (if accessible)
5. Output from `/api/sites/[id]/preview-code` endpoint
