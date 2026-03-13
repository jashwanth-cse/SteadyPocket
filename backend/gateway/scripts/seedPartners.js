/**
 * seedPartners.js
 * Seeds Firestore 'partners' collection with test partner data.
 *
 * Usage:
 *   node scripts/seedPartners.js
 *
 * Requires env vars (or a .env file in the project root):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY        (include the full key with -----BEGIN...-----)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const admin = require('firebase-admin');

// ── Firebase Admin init ───────────────────────────────────────────────────────
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  console.error('❌ Missing Firebase env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = admin.firestore();

// ── Sample partner records ────────────────────────────────────────────────────
const partners = [
  {
    emp_name:        'Ravi Kumar',
    work_location:   'Chennai',
    partner_id:      'SWG93821',
    platform:        'Swiggy',
    weekly_salary:   6200,
    phone:           '+919999999999',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/ravi.jpg',
  },
  {
    emp_name:        'Priya Sharma',
    work_location:   'Bangalore',
    partner_id:      'SWG45102',
    platform:        'Swiggy',
    weekly_salary:   5800,
    phone:           '+919876543210',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/priya.jpg',
  },
  {
    emp_name:        'Arjun Reddy',
    work_location:   'Hyderabad',
    partner_id:      'SWG72364',
    platform:        'Swiggy',
    weekly_salary:   6500,
    phone:           '+918888888888',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/arjun.jpg',
  },
  {
    emp_name:        'Meena Pillai',
    work_location:   'Coimbatore',
    partner_id:      'SWG31987',
    platform:        'Swiggy',
    weekly_salary:   5500,
    phone:           '+917777777777',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/meena.jpg',
  },
  {
    emp_name:        'Suresh Babu',
    work_location:   'Chennai',
    partner_id:      'SWG58833',
    platform:        'Swiggy',
    weekly_salary:   7000,
    phone:           '+916666666666',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/suresh.jpg',
  },
  {
    emp_name:        'Kavitha Nair',
    work_location:   'Kochi',
    partner_id:      'SWG10247',
    platform:        'Swiggy',
    weekly_salary:   5950,
    phone:           '+915555555555',
    profile_pic_url: 'https://storage.googleapis.com/gig-guard-demo/kavitha.jpg',
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Seeding ${partners.length} partners into Firestore...\n`);

  const collection = db.collection('partners');
  const batch = db.batch();

  for (const partner of partners) {
    // Use partner_id as the document ID for easy lookup
    const docRef = collection.doc(partner.partner_id);
    batch.set(docRef, {
      ...partner,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✔ Queued: ${partner.emp_name} (${partner.partner_id})`);
  }

  await batch.commit();
  console.log('\n✅ All partners seeded successfully!\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
