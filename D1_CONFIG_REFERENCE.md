# Quick Reference: Cloudflare D1 Configuration

## Your D1 Database Info
- **Database Name**: ekya
- **Database ID**: cbe7f0c6-f325-4629-a... (Get full ID from Cloudflare dashboard)
- **Size**: 12.29 kB
- **Tables**: 0 (needs migration)

## Configuration Files Updated

### 1. `wrangler.toml` (Root directory)
```toml
[[d1_databases]]
binding = "DB"
database_name = "ekya"
database_id = "YOUR_FULL_UUID_HERE"  # ⚠️ UPDATE THIS!
```

### 2. `backend/prisma/schema.prisma`
```prisma
datasource db {
  provider = "sqlite"  # Changed from postgresql
  url      = env("DATABASE_URL")
}
```

### 3. `backend/.env` (Local development)
```env
DATABASE_URL="file:./dev.db"
```

## Quick Start Commands

### 1. Get Full Database ID
```bash
wrangler d1 list
```

### 2. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 3. Create Local Dev Database
```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Generate D1 Migration SQL
```bash
cd backend
npx prisma migrate diff --from-empty --to-schema-datafile prisma/schema.prisma --script > ../d1-migration.sql
```

### 5. Apply to D1
```bash
wrangler d1 execute ekya --file=./d1-migration.sql
```

### 6. Deploy to Cloudflare
```bash
wrangler deploy
```

## Environment Variables to Set

### Via Wrangler Secrets (Sensitive)
```bash
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### Via wrangler.toml [vars] (Public)
- NODE_ENV
- PORT
- FRONTEND_URL
- GOOGLE_REDIRECT_URI

## Verify D1 Database

### List Tables
```bash
wrangler d1 execute ekya --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Query Data
```bash
wrangler d1 execute ekya --command="SELECT * FROM User LIMIT 5;"
```

### Check Row Counts
```bash
wrangler d1 execute ekya --command="SELECT COUNT(*) as count FROM User;"
```

## Important Notes

⚠️ **Before deploying:**
1. Update `database_id` in `wrangler.toml` with your FULL UUID
2. Run migrations to create tables in D1
3. Set all required secrets via `wrangler secret put`
4. Update FRONTEND_URL to your Cloudflare Pages URL

✅ **Database Provider Changed:**
- PostgreSQL → SQLite (for D1 compatibility)
- Local dev uses `file:./dev.db`
- Production uses D1 binding from Cloudflare Workers

📝 **Next Steps:**
1. Get full database ID: `wrangler d1 list`
2. Update `wrangler.toml`
3. Follow `CLOUDFLARE_DEPLOY_GUIDE.md` for complete deployment
