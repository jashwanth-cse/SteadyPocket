const events = [
  { event_id: 'EVT5001', event_type: 'rain', location: 'Chennai', severity: 'high', start_time: '2026-03-10T14:00:00Z', end_time: '2026-03-10T18:00:00Z', status: 'completed' },
  { event_id: 'EVT5002', event_type: 'strike', location: 'Bangalore', severity: 'critical', start_time: '2026-03-12T06:00:00Z', end_time: '2026-03-12T18:00:00Z', status: 'completed' },
  { event_id: 'EVT5003', event_type: 'heatwave', location: 'Hyderabad', severity: 'medium', start_time: '2026-03-14T12:00:00Z', end_time: '2026-03-14T16:00:00Z', status: 'active' },
  { event_id: 'EVT5004', event_type: 'internet_shutdown', location: 'Mumbai', severity: 'critical', start_time: '2026-03-15T00:00:00Z', end_time: '2026-03-16T00:00:00Z', status: 'active' },
  { event_id: 'EVT5005', event_type: 'road_closure', location: 'Delhi', severity: 'high', start_time: '2026-03-13T09:00:00Z', end_time: '2026-03-13T14:00:00Z', status: 'completed' },
];

async function seedEvents(db, admin) {
  console.log('Seeding Events...');
  const collection = db.collection('events');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (let event of events) {
    const docRef = collection.doc(event.event_id);
    const docSnap = await docRef.get();

    // Convert strings to proper Firestore Timestamps
    const dataToSave = {
      ...event,
      start_time: admin.firestore.Timestamp.fromDate(new Date(event.start_time)),
      end_time: admin.firestore.Timestamp.fromDate(new Date(event.end_time)),
    };

    if (!docSnap.exists) {
      await docRef.set(dataToSave);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(dataToSave)) {
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

  console.log(`Events -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedEvents;
