from fastapi import FastAPI
import joblib
import numpy as np
import os

# Initialize FastAPI app
app = FastAPI()

# -------------------------------
# 📁 Load Model (FIXED PATH ISSUE)
# -------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(BASE_DIR, "model", "fraud_model.pkl")

print("Loading model from:", model_path)

model = joblib.load(model_path)

# -------------------------------
# 🧠 Risk Level Logic
# -------------------------------
def get_risk_level(score):
    if score > 0.7:
        return "HIGH"
    elif score > 0.4:
        return "MEDIUM"
    else:
        return "LOW"

# -------------------------------
# 🚀 Root Endpoint (Test)
# -------------------------------
@app.get("/")
def home():
    return {"message": "Fraud Detection API is running 🚀"}

# -------------------------------
# 🔍 Fraud Prediction Endpoint
# -------------------------------
@app.post("/predict-fraud")
def predict(data: dict):
    try:
        features = np.array([[
            data["distance_from_event"],
            data["gps_variance"],
            data["motion_score"],
            data["idle_time"],
            data["claims_last_7_days"],
            data["ip_stability_score"],
            data["event_match_score"],
            data["cluster_score"]
        ]])

        # Get fraud probability
        prob = model.predict_proba(features)[0][1]

        return {
            "fraud_score": round(float(prob), 2),
            "risk_level": get_risk_level(prob)
        }

    except KeyError as e:
        return {
            "error": f"Missing field: {str(e)}"
        }

    except Exception as e:
        return {
            "error": str(e)
        }