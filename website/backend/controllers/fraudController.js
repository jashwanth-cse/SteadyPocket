const admin = require('firebase-admin');
const { logEvent } = require('../services/auditService');

/**
 * IMPORTANT: FRAUD ALERT RECORDS MUST NEVER BE DELETED.
 * Status updates (Investigate, Ignore, Resolve) must only modify the 'status' field.
 */

// Get all fraud alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const db = admin.firestore();
    const alertsSnapshot = await db.collection('fraud_alerts').orderBy('timestamp', 'desc').get();
    const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(alerts);
  } catch (error) {
    console.error('GetAllAlerts Error:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
};

// Update alert status (Investigate/Ignore/Resolve)
exports.updateAlertStatus = async (req, res) => {
  const { alertId } = req.params;
  const { status, notes } = req.body;
  const adminId = req.user.uid;
  
  const validStatuses = ['pending', 'investigating', 'resolved', 'ignored', 'Under_review', 'Resolved', 'Ignored', 'Action_required'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid alert status: ${status} (v2.1)` });
  }

  try {
    const db = admin.firestore();
    const alertRef = db.collection('fraud_alerts').doc(alertId);
    const alertDoc = await alertRef.get();

    if (!alertDoc.exists) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const oldData = alertDoc.data();

    await alertRef.update({ 
      status,
      notes: notes || '',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: adminId
    });

    // Log action
    await logEvent(adminId, 'FRAUD_ALERT_UPDATE', alertId, {
      oldStatus: oldData.status,
      newStatus: status,
      riskScore: oldData.risk_score
    });

    res.json({ success: true, message: `Fraud alert ${alertId} updated to ${status}` });
  } catch (error) {
    console.error('UpdateAlertStatus Error:', error);
    res.status(500).json({ error: 'Failed to update fraud alert' });
  }
};
