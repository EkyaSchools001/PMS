# Cloudflare Pages Deployment Configuration

This file documents the correct deployment settings for Cloudflare Pages.

## Build Configuration

**Framework preset:** None (Custom)

**Build command:**
```bash
npm run build
```

**Build output directory:**
```
frontend/dist
```

**Root directory:** 
```
/
```

## Deploy Command (IMPORTANT)

**For Cloudflare Pages Dashboard:**
Set the deploy command to:
```bash
npx wrangler pages deploy frontend/dist --project-name=pms
```

**OR** use automatic deployment (recommended):
- Leave deploy command empty
- Cloudflare Pages will automatically deploy `frontend/dist` after build

## Environment Variables

Set these in **Cloudflare Pages** → **Settings** → **Environment variables**:

### Production
- `JWT_SECRET` - Your JWT secret key (use a strong random string)
- `NODE_ENV` - `production`
- `DATABASE_URL` - (Auto-configured via D1 binding)

### Preview (optional)
- Same as production or use different values for testing

## D1 Database Binding

Already configured in `wrangler.toml`:
- Binding name: `DB`
- Database name: `ekya`
- Database ID: `cbe7f0c6-f325-4629-a4ae-17f209f15982`

## Pages Functions

The `functions/[[path]].js` file handles all API requests at `/api/v1/*`

## Deployment URLs

After deployment:
- **Production:** `https://pms.pages.dev`
- **Preview:** `https://[commit-hash].pms.pages.dev`

## Manual Deployment

If you need to deploy manually:

```bash
# From project root
npm run build
npm run deploy
```

Or directly:
```bash
npx wrangler pages deploy frontend/dist --project-name=pms
```
