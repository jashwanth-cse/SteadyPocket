# SteadyPocket API Gateway (Node.js)

This is the central API gateway built with **Node.js** and **Express**. It handles frontend requests, authenticates users via **Firebase Admin**, and securely proxies identity verification tasks (like ID parsing and selfie matching) to the underlying Python FastAPI AI Service.

## 🚀 Tech Stack

- **Environment:** Node.js
- **Framework:** Express.js
- **Authentication:** Firebase Admin SDK
- **File Parsing:** Multer
- **HTTP Client:** Axios (for proxying requests)

## 📦 Installation & Setup

1. **Install Dependencies**

   Navigate to the gateway directory and install npm packages.
   ```bash
   cd backend/gateway
   npm install
   ```

2. **Set Environment Variables**

   Ensure you configure your `.env` file with the required Firebase service account credentials and the AI Service URL.
   ```bash
   cp .env.example .env
   # Update variables in .env
   ```

3. **Start the Server**

   Start the gateway using Nodemon in watch mode for development.
   ```bash
   npm run dev
   # or
   npm start
   ```
   The gateway usually listens on port `3001` (or as configured in your `.env`).

## 📁 Key Features

- **Auth Verification:** Decodes Firebase ID tokens for protected routes.
- **Proxy Layer:** Forwards heavy ML logic (like ID OCR and Liveness checks) to the AI engine.
- **Handling Multipart Form-Data:** Processes heavy image payloads via `multer` from the mobile client.
