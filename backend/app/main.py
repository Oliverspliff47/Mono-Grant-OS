from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mono-Grant-OS API", version="0.1.0")

# CORS - Allow multiple origins for development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now, restrict in production
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
