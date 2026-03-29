#!/bin/bash
set -e

echo "=== Starting ML Model Container ==="
echo "Step 1: Training model and generating premium_model.pkl..."
python train_model.py

echo "Step 2: Model trained successfully. Starting Flask server..."
exec python app.py
