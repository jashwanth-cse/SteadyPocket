require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const admin = require('firebase-admin');

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

async function initializeWallets() {
  console.log('\n=======================================');
  console.log('💰 Initializing Wallet Infrastructure');
  console.log('=======================================\n');

  let walletsCreated = 0;
  let walletsSkipped = 0;

  try {
    const usersSnap = await db.collection('users').get();
    
    if (usersSnap.empty) {
      console.log('ℹ️ No users found in the system.');
      return;
    }

    const batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      if (userData.wallet_id) {
        console.log(`ℹ️ Wallet already exists for user: ${userId}`);
        walletsSkipped++;
        continue;
      }

      const walletId = `WALLET_${userId}`;
      const walletRef = db.collection('wallets').doc(walletId);
      const userRef = db.collection('users').doc(userId);

      // Check if wallet document actually exists just to be extra safe
      const walletSnap = await walletRef.get();
      
      if (!walletSnap.exists) {
        batch.set(walletRef, {
          wallet_id: walletId,
          user_id: userId,
          balance: 0,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          last_updated: admin.firestore.FieldValue.serverTimestamp()
        });
        walletsCreated++;
      } else {
        console.log(`ℹ️ Wallet document already exists for user: ${userId}, linking now.`);
        walletsSkipped++; // Counted as skipped creation since doc exists
      }

      // Always update user document if wallet_id is missing, even if wallet doc existed
      batch.update(userRef, { wallet_id: walletId });
      batchCount++;

      // Commit batch every 400 operations (Firebase limit is 500)
      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n=======================================');
    console.log('✅ Initialization Complete');
    console.log(`✨ Wallets created: ${walletsCreated}`);
    console.log(`⏭️ Wallets skipped: ${walletsSkipped}`);
    console.log('=======================================\n');

  } catch (error) {
    console.error('❌ Error initializing wallets:', error);
  } finally {
    process.exit(0);
  }
}

initializeWallets();
