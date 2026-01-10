FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set default port (Railway overrides with PORT env var)
ENV PORT=8000
EXPOSE $PORT

# Run the application using shell form to expand $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
