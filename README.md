# Mono-Grant-OS

A full-stack project management system for monograph publishing with AI-powered editorial review.

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **AI**: LangChain + OpenAI (GPT-4o)

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Backend (Railway)
1. Create a Railway account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables:
   - `DATABASE_URL` (auto from plugin)
   - `OPENAI_API_KEY` (optional, for AI review)
5. Deploy

### Frontend (Vercel)
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Import from GitHub → Select `frontend` folder as root
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1`
4. Deploy

## Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI review | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## API Endpoints

- `GET /health` - Health check
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/opportunities` - List funding opportunities
- `POST /api/v1/sections/{id}/review` - AI editorial review

## License

MIT
