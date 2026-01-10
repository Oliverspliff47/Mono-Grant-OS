from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mono-Grant-OS API", version="0.1.0")

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
