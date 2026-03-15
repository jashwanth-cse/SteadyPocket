require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const admin = require('firebase-admin');

const seedUsers = require('./seedUsers');
const seedPolicies = require('./seedPolicies');
const seedEvents = require('./seedEvents');
const seedPayouts = require('./seedPayouts');
const seedFraudAlerts = require('./seedFraudAlerts');
const seedSystemEvents = require('./seedSystemEvents');

// Initialize Firebase Admin
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  console.error('❌ Missing Firebase env vars. Please check .env file.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

const db = admin.firestore();

async function runSeeder() {
  console.log('\n=======================================');
  console.log('🚀 Starting Steady Pocket Data Seeder');
  console.log('=======================================\n');

  try {
    await seedUsers(db, admin);
    await seedPolicies(db, admin);
    await seedEvents(db, admin);
    await seedPayouts(db, admin);
    await seedFraudAlerts(db, admin);
    await seedSystemEvents(db, admin);
    
    console.log('\n✅ All data seated successfully without corrupting existing fields.\n');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
  } finally {
    process.exit(0);
  }
}

runSeeder();
