@echo off
echo 🚀 PMS Final Deployment Steps
echo ---------------------------------

cd backend

echo 📊 1. Applying Database Schema to D1...
npx wrangler d1 execute ekya --remote --file=prisma/migration.sql --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Migration failed. Please check your wrangler login.
    pause
    exit /b %ERRORLEVEL%
)

echo 🌱 2. Seeding Initial Data (Admin Account)...
npx wrangler d1 execute ekya --remote --file=prisma/seed.sql --yes
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Seeding failed.
    pause
    exit /b %ERRORLEVEL%
)

echo ✨ All set! You can now log in at your frontend URL.
echo Admin Email: admin@pms.com
echo Password: password123
pause
