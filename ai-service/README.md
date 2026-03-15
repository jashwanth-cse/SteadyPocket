# SteadyPocket AI Service (Python FastAPI)

This is the core machine learning backend built using Python and **FastAPI**. It provides dedicated AI endpoints for OCR (document parsing via Google Vision / Gemini) and facial recognition (FaceNet PyTorch) to securely onboard gig delivery partners without manual intervention.

## 🚀 Tech Stack

- **Framework:** FastAPI / Uvicorn
- **Language:** Python
- **Machine Learning / OCR:** 
  - `facenet-pytorch` (Facial recognition / liveness)
  - `google-cloud-vision` (OCR text extraction)
  - `google-generativeai` (Gemini API for unstructured data parsing)

## 📦 Installation & Setup

1. **Create a Virtual Environment (Recommended)**

   Navigate to the AI service directory and create a python virtual environment.
   ```bash
   cd ai-service
   python -m venv venv
   
   # Activate on Windows:
   venv\Scripts\activate
   # Activate on macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**

   Install all required modeling packages. (Note: These include PyTorch dependencies).
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables**

   You will need to pass your Google Cloud / Google AI API keys. Create a `.env` file.
   ```bash
   cp .env.example .env
   # Update variables like GOOGLE_API_KEY
   ```

4. **Start the FastAPI Server**

   Use `uvicorn` to spin up the server with hot-reloading for development.
   ```bash
   uvicorn main:app --reload
   ```
   By default, FastAPI will run on http://localhost:8000. You can visit http://localhost:8000/docs for Swagger UI API documentation.

## 📁 Key Endpoints

- **`POST /verify/swiggy-id`**: Extracts names, platforms, and IDs from ID Cards using OCR.
- **`POST /verify/selfie`**: Cross-references physical selfies with ID card photos using PyTorch FaceNet distance algorithms.
