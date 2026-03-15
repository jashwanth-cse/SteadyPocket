const users = [
  { user_id: 'USR1001', phone: '+919999999001', emp_name: 'Ravi Kumar', platform: 'Swiggy', work_location: 'Chennai', partner_id: 'SWG93821', weekly_salary: 6200, risk_score: 0.21, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1001' },
  { user_id: 'USR1002', phone: '+919999999002', emp_name: 'Imran Khan', platform: 'Zomato', work_location: 'Bangalore', partner_id: 'ZOM44211', weekly_salary: 5800, risk_score: 0.35, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1002' },
  { user_id: 'USR1003', phone: '+919999999003', emp_name: 'Meena Pillai', platform: 'Swiggy', work_location: 'Hyderabad', partner_id: 'SWG22391', weekly_salary: 6500, risk_score: 0.15, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1003' },
  { user_id: 'USR1004', phone: '+919999999004', emp_name: 'Amit Patel', platform: 'Zomato', work_location: 'Mumbai', partner_id: 'ZOM88122', weekly_salary: 7200, risk_score: 0.45, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1004' },
  { user_id: 'USR1005', phone: '+919999999005', emp_name: 'Suresh Raina', platform: 'Swiggy', work_location: 'Delhi', partner_id: 'SWG77233', weekly_salary: 5100, risk_score: 0.25, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1005' },
  { user_id: 'USR1006', phone: '+919999999006', emp_name: 'Lakshmi N', platform: 'Zomato', work_location: 'Chennai', partner_id: 'ZOM11344', weekly_salary: 6000, risk_score: 0.18, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1006' },
  { user_id: 'USR1007', phone: '+919999999007', emp_name: 'Vikram Singh', platform: 'Swiggy', work_location: 'Pune', partner_id: 'SWG99155', weekly_salary: 8000, risk_score: 0.55, status: 'suspended', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1007' },
  { user_id: 'USR1008', phone: '+919999999008', emp_name: 'Pooja Sharma', platform: 'Zomato', work_location: 'Bangalore', partner_id: 'ZOM55466', weekly_salary: 5400, risk_score: 0.22, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1008' },
  { user_id: 'USR1009', phone: '+919999999009', emp_name: 'Arjun Das', platform: 'Swiggy', work_location: 'Kolkata', partner_id: 'SWG33277', weekly_salary: 4900, risk_score: 0.31, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1009' },
  { user_id: 'USR1010', phone: '+919999999010', emp_name: 'Rahul Dravid', platform: 'Zomato', work_location: 'Chennai', partner_id: 'ZOM88988', weekly_salary: 6700, risk_score: 0.12, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1010' },
  { user_id: 'USR1011', phone: '+919999999011', emp_name: 'Karthik V', platform: 'Swiggy', work_location: 'Hyderabad', partner_id: 'SWG55699', weekly_salary: 5900, risk_score: 0.28, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1011' },
  { user_id: 'USR1012', phone: '+919999999012', emp_name: 'Neha Gupta', platform: 'Zomato', work_location: 'Mumbai', partner_id: 'ZOM22511', weekly_salary: 7500, risk_score: 0.41, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1012' },
  { user_id: 'USR1013', phone: '+919999999013', emp_name: 'Sanjay Dutt', platform: 'Swiggy', work_location: 'Delhi', partner_id: 'SWG44122', weekly_salary: 5300, risk_score: 0.19, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1013' },
  { user_id: 'USR1014', phone: '+919999999014', emp_name: 'Anita Roy', platform: 'Zomato', work_location: 'Pune', partner_id: 'ZOM66333', weekly_salary: 6100, risk_score: 0.26, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1014' },
  { user_id: 'USR1015', phone: '+919999999015', emp_name: 'Manoj Tiwari', platform: 'Swiggy', work_location: 'Kolkata', partner_id: 'SWG77844', weekly_salary: 4800, risk_score: 0.33, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1015' },
  { user_id: 'USR1016', phone: '+919999999016', emp_name: 'Divya S', platform: 'Zomato', work_location: 'Bangalore', partner_id: 'ZOM11955', weekly_salary: 6400, risk_score: 0.17, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1016' },
  { user_id: 'USR1017', phone: '+919999999017', emp_name: 'Prakash Raj', platform: 'Swiggy', work_location: 'Chennai', partner_id: 'SWG99266', weekly_salary: 7100, risk_score: 0.61, status: 'under_review', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1017' },
  { user_id: 'USR1018', phone: '+919999999018', emp_name: 'Kiran Bedi', platform: 'Zomato', work_location: 'Hyderabad', partner_id: 'ZOM44777', weekly_salary: 5600, risk_score: 0.24, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1018' },
  { user_id: 'USR1019', phone: '+919999999019', emp_name: 'Raj K', platform: 'Swiggy', work_location: 'Mumbai', partner_id: 'SWG22888', weekly_salary: 6800, risk_score: 0.38, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1019' },
  { user_id: 'USR1020', phone: '+919999999020', emp_name: 'Sneha P', platform: 'Zomato', work_location: 'Delhi', partner_id: 'ZOM55399', weekly_salary: 6300, risk_score: 0.20, status: 'active', profile_pic_url: 'https://i.pravatar.cc/150?u=USR1020' },
];

async function seedUsers(db, admin) {
  console.log('Seeding Users...');
  const collection = db.collection('users');
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const user of users) {
    const docRef = collection.doc(user.user_id);
    const docSnap = await docRef.get();

    user.created_at = admin.firestore.FieldValue.serverTimestamp();

    if (!docSnap.exists) {
      await docRef.set(user);
      added++;
    } else {
      const existingData = docSnap.data();
      const newData = {};
      for (const [key, value] of Object.entries(user)) {
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

  console.log(`Users -> Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`);
}

module.exports = seedUsers;
