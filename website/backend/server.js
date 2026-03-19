const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const fs = require('fs');
const path = require('path');
const serviceAccountPath = path.join(__dirname, 'service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase initialized with service-account.json');
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized with FIREBASE_SERVICE_ACCOUNT env');
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env:', err.message);
    admin.initializeApp({ projectId: 'para-insurance-platform' });
  }
} else {
  console.warn('WARNING: No Firebase credentials found. Using placeholder.');
  admin.initializeApp({
    projectId: 'para-insurance-platform'
  });
}

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Routes
const userRoutes = require('./routes/userRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { startCronJobs } = require('./cron/jobs');

app.use('/api/users', userRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start Cron Jobs
startCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`Steady Pocket Admin Backend running on port ${PORT}`);
});

module.exports = { app, db };
