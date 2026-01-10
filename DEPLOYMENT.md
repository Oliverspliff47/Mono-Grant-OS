# Deployment Guide - Mono-Grant-OS

This guide covers deploying the full-stack application to production.

## Architecture

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Backend (FastAPI) | Railway | `https://your-app.railway.app` |
| Frontend (Next.js) | Vercel | `https://your-app.vercel.app` |
| Database | Railway PostgreSQL | Managed (internal) |

---

## Prerequisites

- [ ] GitHub account with this repository pushed
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] (Optional) OpenAI API key for AI review feature

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `Mono-Grant-OS` repository
4. Railway will auto-detect the Dockerfile in `/backend`

### 1.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` environment variable

### 1.3 Configure Backend Service

1. Click on your backend service
2. Go to **Settings** → **Root Directory** → Set to `/backend`
3. Go to **Variables** and add:

```
OPENAI_API_KEY=sk-your-key-here  # Optional, for AI review
```

4. Railway auto-provides `DATABASE_URL` and `PORT`

### 1.4 Deploy

1. Click **"Deploy"** or push to your GitHub repo
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://mono-grant-os-production.railway.app`)

### 1.5 Verify Backend

```bash
curl https://YOUR_BACKEND_URL/api/v1/projects
# Should return: []
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import `Mono-Grant-OS` repository

### 2.2 Configure Build Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### 2.3 Set Environment Variables

Add the following environment variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR_BACKEND_URL/api/v1` |

Replace `YOUR_BACKEND_URL` with your Railway backend URL from Step 1.4.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Access your frontend at the provided Vercel URL

---

## Step 3: Verify Production

### Health Check

```bash
# Backend health
curl https://YOUR_BACKEND_URL/api/v1/dashboard/stats

# Should return stats JSON
```

### Functional Test

1. Open your Vercel frontend URL
2. Create a new project from the Dashboard
3. Navigate to Funding page and create an opportunity
4. Verify data persists after page refresh

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Auto | PostgreSQL connection string (auto-provided) |
| `PORT` | ✅ Auto | Server port (auto-provided) |
| `OPENAI_API_KEY` | ❌ Optional | For AI section review feature |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL with `/api/v1` suffix |

---

## Troubleshooting

### Backend won't start

- Check Railway logs for errors
- Verify `DATABASE_URL` is set correctly
- Ensure Dockerfile root directory is `/backend`

### CORS errors in browser

- The backend is configured to allow all origins in development
- For production, update `app/main.py` CORS settings if needed

### Database connection failed

- Verify PostgreSQL addon is running in Railway
- Check if `DATABASE_URL` format is correct (`postgresql://...`)

---

## Local Development

To run locally with production-like settings:

```bash
# Backend
cd backend
source venv/bin/activate
DATABASE_URL="postgresql://..." uvicorn app.main:app --port 8000

# Frontend
cd frontend
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1" npm run dev
```
