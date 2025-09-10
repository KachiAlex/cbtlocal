# CBT Local Institution - Windows Deployment Guide

This package runs a single-institution CBT app locally on a Windows server. It excludes all multi-tenant admin features.

## Contents
- backend/ (Express + MongoDB models; serves admin/student pages from `public/`)
- frontend/ (optional; not required when serving static pages from backend)

## Prerequisites
- Windows Server 2019/2022 or Windows 10/11
- Administrator privileges
- Internet access (for initial setup)

## Install Dependencies

1) Install Node.js LTS
```powershell
winget install OpenJS.NodeJS.LTS -h --accept-package-agreements --accept-source-agreements
```

2) Install MongoDB Community Server
- Download and install: `https://www.mongodb.com/try/download/community`
- Ensure "Run service as Network Service user" is selected, or default service user
- Service should start automatically as `MongoDB` on port 27017

3) (Recommended) Install PM2 to run as a Windows service
```powershell
npm install -g pm2
```

## Configure Backend

1) Create `.env` from template
```powershell
cd C:\CBT\cbt-local-institution\backend
copy env.example .env
notepad .env
```

2) Set mandatory variables in `.env`:
- `MONGODB_URI=mongodb://localhost:27017/cbt_local`
- `PORT=5000`
- `JWT_SECRET=change-me`

3) Install dependencies
```powershell
cd C:\CBT\cbt-local-institution\backend
npm ci
```

## Run (for testing)
```powershell
node src/server.js
```
- Admin UI: `http://localhost:5000/admin`
- Student UI: `http://localhost:5000/student`
- Health: `http://localhost:5000/health`

Press Ctrl+C to stop.

## Run as a Service (PM2)

1) Start the app under PM2
```powershell
cd C:\CBT\cbt-local-institution\backend
pm2 start src/server.js --name cbt-local --time
```

2) Save the PM2 process list and enable startup on boot
```powershell
pm2 save
pm2 startup windows
# Run the command PM2 prints (requires Admin privileges), then:
pm2 save
```

3) Common PM2 commands
```powershell
pm2 status
pm2 logs cbt-local --lines 200
pm2 restart cbt-local
pm2 stop cbt-local
pm2 delete cbt-local
```

## Firewall & Networking
- Allow inbound TCP on port `5000` (or the port you set in `.env`).
- For intranet access: use `http://<server-ip>:5000`.
- For a friendly URL/SSL, place IIS/Nginx in front and reverse proxy to `http://127.0.0.1:5000`.

## Backups
- Database backup (run from server):
```powershell
"C:\Program Files\MongoDB\Tools\<version>\bin\mongodump.exe" --db cbt_local --out C:\backups\cbt_local_$(Get-Date -Format yyyyMMddHHmm)
```
- To restore:
```powershell
"C:\Program Files\MongoDB\Tools\<version>\bin\mongorestore.exe" --db cbt_local C:\backups\cbt_local_<timestamp>\cbt_local
```

## Notes
- Multi-tenant routes/models are excluded (no `Tenant`, no `/api/tenants/*`).
- Uses models: `User`, `Exam`, `Question`, `Result`.
- Static admin/student pages are served from `backend/public`.
- If you prefer a full React frontend, build it separately and serve via IIS/Nginx, pointing it to the backend API (`http://<server-ip>:5000`).

## Troubleshooting
- Verify MongoDB service is running: `services.msc` → MongoDB → Running
- Test DB connectivity: `mongo --eval "db.stats()"` (if Mongo Shell is installed)
- Check app logs: `pm2 logs cbt-local`
- Check health endpoint: `http://localhost:5000/health`
