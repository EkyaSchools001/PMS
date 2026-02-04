# 🚀 Cloudflare D1 Deployment Guide

This guide will help you deploy your PMS application to Cloudflare using D1 Database (SQLite).

---

## 📋 Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - Cloudflare's command-line tool
3. **Node.js & npm** - Already installed

---

## 🛠️ Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

Login to Cloudflare:
```bash
wrangler login
```

---

## 🗄️ Step 2: Configure D1 Database

### Get Your Database ID

From your Cloudflare dashboard screenshot, you have:
- **Database Name**: `ekya`
- **Database UUID**: `cbe7f0c6-f325-4629-a...` (partial)

To get the full UUID:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **D1**
3. Click on your `ekya` database
4. Copy the full **Database ID**

### Update wrangler.toml

Open `wrangler.toml` in the root directory and replace the `database_id` with your full UUID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ekya"
database_id = "YOUR_FULL_DATABASE_ID_HERE"
```

---

## 🔄 Step 3: Generate Prisma Schema for SQLite

I've already updated your `schema.prisma` to use SQLite. Now generate the Prisma client:

```bash
cd backend
npx prisma generate
```

---

## 📊 Step 4: Create Database Schema in D1

### Generate SQL Migration

First, create a migration SQL file from your Prisma schema:

```bash
cd backend
npx prisma migrate diff --from-empty --to-schema-datafile prisma/schema.prisma --script > ../d1-migration.sql
```

### Apply Migration to D1

From the root directory:

```bash
wrangler d1 execute ekya --file=./d1-migration.sql
```

This will create all your tables in the Cloudflare D1 database.

---

## 🔐 Step 5: Set Environment Variables

### Set Secrets (Sensitive Data)

```bash
# JWT Secret
wrangler secret put JWT_SECRET
# When prompted, enter: supersecretkey_change_in_production

# Google Client ID (if using Google Calendar)
wrangler secret put GOOGLE_CLIENT_ID
# Enter your Google Client ID

# Google Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google Client Secret
```

### Set Public Variables

Edit `wrangler.toml` and update the `[vars]` section:

```toml
[vars]
NODE_ENV = "production"
PORT = "8787"
FRONTEND_URL = "https://your-frontend-url.pages.dev"
GOOGLE_REDIRECT_URI = "https://your-worker-url.workers.dev/api/v1/auth/google/callback"
```

---

## 🚀 Step 6: Deploy Backend to Cloudflare Workers

### Update Backend for D1

You'll need to modify your backend to use D1 instead of direct Prisma. Create a new file `backend/src/db/d1-adapter.js`:

```javascript
// This adapter will bridge Prisma queries to D1
export class D1Adapter {
  constructor(d1Database) {
    this.db = d1Database;
  }

  async query(sql, params = []) {
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results;
  }

  async execute(sql, params = []) {
    return await this.db.prepare(sql).bind(...params).run();
  }
}
```

### Deploy

From the root directory:

```bash
wrangler deploy
```

After deployment, you'll get a URL like: `https://pms-backend.your-subdomain.workers.dev`

---

## 🎨 Step 7: Deploy Frontend to Cloudflare Pages

### Option 1: Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create Application** → **Pages**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `frontend`
5. Add environment variable:
   - `VITE_API_URL`: `https://pms-backend.your-subdomain.workers.dev/api/v1/`
6. Click **Save and Deploy**

### Option 2: Via Wrangler CLI

```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=pms-frontend
```

---

## 🌱 Step 8: Seed Initial Data

Create a seed script for D1:

```bash
# Create seed.sql with initial admin user and demo data
wrangler d1 execute ekya --file=./backend/prisma/seed.sql
```

---

## ✅ Step 9: Test Your Deployment

1. Open your Cloudflare Pages URL (e.g., `https://pms-frontend.pages.dev`)
2. Try to register a new account
3. Login with demo credentials
4. Test creating projects, tasks, etc.

---

## 🔍 Step 10: Monitor and Debug

### View Logs

```bash
wrangler tail
```

### Check D1 Database

```bash
# List all tables
wrangler d1 execute ekya --command="SELECT name FROM sqlite_master WHERE type='table';"

# Query users
wrangler d1 execute ekya --command="SELECT * FROM User LIMIT 10;"
```

---

## 📝 Important Notes

### D1 Limitations

1. **SQLite vs PostgreSQL**: D1 uses SQLite, which has some differences:
   - No `SERIAL` type (use `INTEGER PRIMARY KEY AUTOINCREMENT`)
   - Different date/time handling
   - No native UUID type (stored as TEXT)

2. **Prisma with D1**: Currently, Prisma doesn't have native D1 support. You may need to:
   - Use Prisma for schema management only
   - Write raw SQL queries for D1
   - Or use a D1 adapter library

### Alternative: Use Prisma Accelerate

If you want to keep using Prisma ORM directly:
1. Use [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) as a connection pooler
2. This allows Prisma to work with D1 via HTTP

---

## 🆘 Troubleshooting

### Error: "Database not found"
- Verify your `database_id` in `wrangler.toml` matches exactly

### Error: "Prisma Client not found"
- Run `npx prisma generate` in the backend directory

### CORS Issues
- Update `FRONTEND_URL` in your environment variables
- Ensure CORS is properly configured in `server.js`

### Migration Errors
- Check the generated SQL is compatible with SQLite
- Remove PostgreSQL-specific syntax (e.g., `::uuid`, `SERIAL`)

---

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Prisma with SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)

---

## 🎯 Next Steps

1. ✅ Update `database_id` in `wrangler.toml`
2. ✅ Generate Prisma client: `npx prisma generate`
3. ✅ Create migration SQL
4. ✅ Apply migration to D1
5. ✅ Deploy backend: `wrangler deploy`
6. ✅ Deploy frontend to Cloudflare Pages
7. ✅ Test the application

Good luck with your deployment! 🚀
