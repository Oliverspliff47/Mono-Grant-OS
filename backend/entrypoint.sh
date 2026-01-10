#!/bin/sh
# Entrypoint script to properly expand $PORT variable
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
