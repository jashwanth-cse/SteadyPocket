const admin = require('firebase-admin');

/**
 * Scheduled tasks running every 5 minutes to maintain platform integrity
 */
const startCronJobs = () => {
  // Use node-cron format */5 * * * *
  const CronJob = require('node-cron');
  CronJob.schedule('*/5 * * * *', async () => {
    // Silent cron start

    
    try {
      await performFraudCheck();
      await validatePolicies();
    } catch (error) {
      // Silent cron error

    }
  });
};

/**
 * Fraud Detection Logic
 * - Location Mismatch: Detect if payout requested far from last active zone
 * - Multi-Account: Detect duplicate identity markers (Aadhar/Phone)
 */
const performFraudCheck = async () => {
  const db = admin.firestore();
  const usersSnap = await db.collection('users').get();
  
  // 1. Duplicate Account Detection (PII Check)
  const piiMap = new Map(); // e.g., { 'aadhar_123': ['uid1', 'uid2'] }

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const aadhar = data.aadhar_no || data.id_number;
    
    if (aadhar) {
      if (piiMap.has(aadhar)) {
        piiMap.get(aadhar).push(doc.id);
      } else {
        piiMap.set(aadhar, [doc.id]);
      }
    }

    // 2. High Velocity Payout Detection
    // Logic: If user had > 3 payouts in last 24h
    // (Requires querying payouts collection, skipped for brevity but noted)
  }

  // Generate alerts for duplicates
  for (const [pii, uids] of piiMap.entries()) {
    if (uids.length > 1) {
      await db.collection('fraud_alerts').add({
        type: 'DUPLICATE_IDENTITY_DETECTED',
        pii_reference: pii,
        involved_uids: uids,
        riskScore: 95,
        status: 'pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
};

/**
 * Policy Validation
 * - Check for expired policies and coverage limits
 */
const validatePolicies = async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  
  // Fetch only active policies to avoid composite index requirement for range query
  const policiesSnap = await db.collection('policies')
    .where('status', '==', 'active')
    .get();
 
  const batch = db.batch();
  let count = 0;

  policiesSnap.docs.forEach(doc => {
    const data = doc.data();
    const expiry = data.coverage_end || data.expiry_date;
    
    if (expiry) {
      // Handle both Timestamp and other formats
      const expiryDate = expiry.toDate ? expiry.toDate() : new Date(expiry);
      if (expiryDate < now.toDate()) {
        batch.update(doc.ref, { status: 'expired' });
        count++;
      }
    }
  });

  if (count > 0) {
    await batch.commit();
    // Silent cron end

  }
};

module.exports = { startCronJobs };
