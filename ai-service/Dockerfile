FROM python:3.11-slim

# System deps for OpenCV, DeepFace, facenet-pytorch, and TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxrender1 libxext6 ffmpeg \
    gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY main.py .
COPY models/ ./models/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/

# Copy GCP service account credentials (needed for Firestore + Cloud Vision)
COPY config/gcp-service-account.json ./config/gcp-service-account.json

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-service-account.json

EXPOSE 8080

# Use shell form so $PORT is expanded at runtime
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
