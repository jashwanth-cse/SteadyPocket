const admin = require('firebase-admin');
const { logEvent } = require('../services/auditService');

/**
 * IMPORTANT: USER RECORDS MUST NEVER BE DELETED.
 * All administrative actions (Ban, Suspend, etc.) must only update the 'status' field.
 * This ensures audit traceability and data integrity.
 */

// Get all riders - with role-based filtering if needed
exports.getAllRiders = async (req, res) => {
  try {
    const db = admin.firestore();
    const ridersSnapshot = await db.collection('users').get();
    const riders = ridersSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    res.json(riders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch riders from platform' });
  }
};

// Update rider status (Suspend/Ban/Restore)
exports.updateRiderStatus = async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;
  const adminId = req.user.uid; // From authMiddleware
  
  const validStatuses = ['active', 'suspended', 'banned', 'under_review'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Rider identity not found in database' });
    }

    const currentData = userDoc.data();
    
    // Logic: Cannot restore banned user without admin permission (already handled by checkRole if applied to route)
    if (currentData.status === 'banned' && status === 'active' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can lift a permanent ban' });
    }

    await userRef.update({ 
      status, 
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      last_modified_by: adminId
    });

    // Log the action to system_events via service
    await logEvent(adminId, 'RIDER_STATUS_UPDATE', userId, {
      oldStatus: currentData.status,
      newStatus: status,
      reason: reason || 'Not specified'
    });

    res.json({ 
      success: true,
      message: `Rider ${userId} status transitioned to ${status.toUpperCase()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Silent error

    res.status(500).json({ error: 'Transaction failed during status update' });
  }
};
