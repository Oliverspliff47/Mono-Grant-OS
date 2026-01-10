from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database migrations on startup
    try:
        from alembic.config import Config
        from alembic import command
        
        # Only run if we have a database URL configured
        if os.getenv("DATABASE_URL"):
            logger.info("Running database migrations...")
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations complete.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
    
    yield

app = FastAPI(title="Mono-Grant-OS API", version="0.1.0", lifespan=lifespan)

import os

# CORS - Allow multiple origins for development, restrict in production
origins_str = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import endpoints
app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Mono-Grant-OS Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
