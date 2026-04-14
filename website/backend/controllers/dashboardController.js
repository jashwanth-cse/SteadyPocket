const admin = require('firebase-admin');

exports.getStats = async (req, res) => {
  try {
    const db = admin.firestore();
    
    const fetchCollection = async (collName, orderField = null) => {
      try {
        let query = db.collection(collName);
        if (orderField) query = query.orderBy(orderField, 'desc').limit(50);
        const snap = await query.get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn(`Warning: Failed to fetch ${collName}:`, err.message);
        return [];
      }
    };

    const [riders, payouts, alerts, systemEvents] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('payouts'),
      fetchCollection('fraud_alerts'),
      fetchCollection('system_events', 'timestamp')
    ]);

    res.json({
      riders,
      payouts,
      alerts,
      systemEvents
    });
  } catch (error) {
    // Silent error

    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
};
