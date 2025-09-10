# Windows One-Click Installer - Usage

This folder contains a PowerShell installer to set up the Local Institution CBT backend on a Windows machine.

## Files
- `install-windows.ps1`: One-click setup for Node, PM2, env, dependencies, and service.

## Prerequisites
- Run as Administrator
- MongoDB Community Server installed and running as the `MongoDB` Windows service
- Internet access for initial dependency installation

## Steps
1) Copy the `cbt-local-institution` folder to the target server (e.g., `C:\CBT\cbt-local-institution`).
2) Open PowerShell as Administrator.
3) Navigate to the scripts folder:
```powershell
cd C:\CBT\cbt-local-institution\scripts
```
4) Run the installer:
```powershell
powershell -ExecutionPolicy Bypass -NoProfile -File .\install-windows.ps1
```

The script will:
- Ensure Node.js LTS is installed (via winget)
- Install PM2 globally
- Verify MongoDB service
- Create `.env` from `backend\env.example` if it does not exist
- Install backend dependencies (`npm ci` or `npm install`)
- Start the app with PM2 and configure it to start on boot

## After Installation
- Admin UI: `http://localhost:5000/admin`
- Student UI: `http://localhost:5000/student`
- Health: `http://localhost:5000/health`

## PM2 Management
```powershell
pm2 status
pm2 logs cbt-local --lines 200
pm2 restart cbt-local
pm2 stop cbt-local
pm2 delete cbt-local
```

## Troubleshooting
- Ensure MongoDB service is running (`services.msc`) and listening on port 27017
- Check PM2 logs: `pm2 logs cbt-local`
- Verify `.env` values in `C:\CBT\cbt-local-institution\backend\.env`
