from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Use SQLite fallback if no DATABASE_URL is set (for local development)
if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./mono_grant.db"

# Production tuning
is_production = os.getenv("RAILWAY_ENVIRONMENT", "production") == "production"
echo_sql = os.getenv("ECHO_SQL", "False").lower() == "true"

engine = create_async_engine(
    DATABASE_URL,
    echo=echo_sql,
    pool_size=int(os.getenv("DB_POOL_SIZE", 20)),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", 10)),
    pool_pre_ping=True,  # Check connection health before usage
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
