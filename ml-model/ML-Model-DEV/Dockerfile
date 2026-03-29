# Use official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed by XGBoost/numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source files
COPY train_model.py .
COPY app.py .
COPY entrypoint.sh .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Cloud Run listens on $PORT (default 8080)
ENV PORT=8080

# Expose port
EXPOSE 8080

# Entrypoint: train model first, then start Flask
ENTRYPOINT ["./entrypoint.sh"]
