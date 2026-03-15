const policies = Array.from({ length: 20 }).map((_, i) => {
  const isSwiggy = i % 2 === 0;
  const num = (i + 1).toString().padStart(2, '0');
  const userId = `USR10${num}`;
  return {
    policy_id: `POL20${num}`,
    user_id: userId,
    premium: 90 + (i * 5),
    coverage_limit: 4500 + (i * 100),
    coverage_start: '2026-03-01',
    coverage_end: '2026-03-31',
    status: i === 6 ? 'expired' : 'active',
    risk_score: 0.15 + (i * 0.02)
  };
});

async function seedPolicies(db, admin) {
  console.log('Seeding Policies...');
  const collection = db.collection('policies');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const policy of policies) {
    const docRef = collection.doc(policy.policy_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      await docRef.set(policy);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(policy)) {
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

  console.log(`Policies -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedPolicies;
