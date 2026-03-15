const alerts = [
  { alert_id: 'FRA7001', user_id: 'USR1003', alert_type: 'location_mismatch', risk_score: 0.91, status: 'under_review' },
  { alert_id: 'FRA7002', user_id: 'USR1007', alert_type: 'impossible_travel_speed', risk_score: 0.88, status: 'resolved' },
  { alert_id: 'FRA7003', user_id: 'USR1011', alert_type: 'gps_spoofing', risk_score: 0.95, status: 'action_required' },
  { alert_id: 'FRA7004', user_id: 'USR1017', alert_type: 'abnormal_claim_frequency', risk_score: 0.82, status: 'under_review' },
  { alert_id: 'FRA7005', user_id: 'USR1020', alert_type: 'device_mismatch', risk_score: 0.75, status: 'resolved' },
];

async function seedFraudAlerts(db, admin) {
  console.log('Seeding Fraud Alerts...');
  const collection = db.collection('fraud_alerts');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const alert of alerts) {
    const docRef = collection.doc(alert.alert_id);
    const docSnap = await docRef.get();

    alert.timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (!docSnap.exists) {
      await docRef.set(alert);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(alert)) {
        if (existingData[key] === undefined) {
          newData[key] = value;
        }
      }
      if (Object.keys(newData).length > 0) {
        await docRef.update(newData);
        updated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`Fraud Alerts -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedFraudAlerts;
