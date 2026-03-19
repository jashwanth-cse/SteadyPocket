// Generate 30 system events
const systemEvents = Array.from({ length: 30 }).map((_, i) => {
  const num = ((i % 20) + 1).toString().padStart(2, '0');
  const userId = `USR10${num}`;
  
  const types = ['USER_SIGNUP', 'POLICY_ACTIVATED', 'PAYOUT_COMPLETED', 'PREMIUM_CHARGED', 'FRAUD_ALERT_TRIGGERED'];
  const event_type = types[i % types.length];
  
  let details = '';
  switch (event_type) {
    case 'USER_SIGNUP': details = 'New rider registered via app'; break;
    case 'POLICY_ACTIVATED': details = 'Coverage started for current week'; break;
    case 'PAYOUT_COMPLETED': details = 'Automatic compensation credited to bank'; break;
    case 'PREMIUM_CHARGED': details = 'Weekly premium deducted successfully'; break;
    case 'FRAUD_ALERT_TRIGGERED': details = 'Anomaly detected in rider behavior'; break;
  }

  return {
    event_type,
    user_id: userId,
    details,
  };
});

async function seedSystemEvents(db, admin) {
  console.log('Seeding System Events...');
  const collection = db.collection('system_events');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const [index, event] of systemEvents.entries()) {
    // Generate an ID for idempotency: SYS8001, SYS8002...
    const docId = `SYS${(8001 + index).toString()}`;
    const docRef = collection.doc(docId);
    const docSnap = await docRef.get();

    event.timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (!docSnap.exists) {
      await docRef.set(event);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(event)) {
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

  console.log(`System Events -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedSystemEvents;
