const payouts = [
  { payout_id: 'PAY3001', user_id: 'USR1001', event_id: 'EVT5001', amount: 420, status: 'completed' },
  { payout_id: 'PAY3002', user_id: 'USR1003', event_id: 'EVT5001', amount: 380, status: 'completed' },
  { payout_id: 'PAY3003', user_id: 'USR1006', event_id: 'EVT5001', amount: 400, status: 'completed' },
  { payout_id: 'PAY3004', user_id: 'USR1008', event_id: 'EVT5002', amount: 500, status: 'completed' },
  { payout_id: 'PAY3005', user_id: 'USR1012', event_id: 'EVT5004', amount: 450, status: 'completed' },
  { payout_id: 'PAY3006', user_id: 'USR1016', event_id: 'EVT5002', amount: 480, status: 'completed' },
  { payout_id: 'PAY3007', user_id: 'USR1017', event_id: 'EVT5001', amount: 460, status: 'failed' },
  { payout_id: 'PAY3008', user_id: 'USR1019', event_id: 'EVT5004', amount: 410, status: 'completed' },
  { payout_id: 'PAY3009', user_id: 'USR1004', event_id: 'EVT5004', amount: 430, status: 'completed' },
  { payout_id: 'PAY3010', user_id: 'USR1015', event_id: 'EVT5001', amount: 390, status: 'completed' },
];

async function seedPayouts(db, admin) {
  console.log('Seeding Payouts...');
  const collection = db.collection('payouts');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const payout of payouts) {
    const docRef = collection.doc(payout.payout_id);
    const docSnap = await docRef.get();

    payout.timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (!docSnap.exists) {
      await docRef.set(payout);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(payout)) {
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

  console.log(`Payouts -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedPayouts;
