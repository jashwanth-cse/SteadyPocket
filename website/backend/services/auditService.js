const admin = require('firebase-admin');

/**
 * Log an admin action to the system_events collection
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} action - Description of the action (e.g., 'USER_BAN')
 * @param {string} targetId - ID of the entity being acted upon
 * @param {Object} metadata - Additional context
 */
const logEvent = async (adminId, action, targetId, metadata = {}) => {
  try {
    const db = admin.firestore();
    await db.collection('system_events').add({
      adminId,
      action,
      targetId,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    // Silent catch
  }
};

module.exports = { logEvent };
