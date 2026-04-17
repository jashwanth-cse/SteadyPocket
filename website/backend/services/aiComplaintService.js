const admin = require("firebase-admin");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Aggregates all relevant data for a complaint to provide context to AI.
 */
async function aggregateComplaintData(complaintId) {
  const db = admin.firestore();
  
  // 1. Fetch the complaint
  const complaintDoc = await db.collection("complaints").doc(complaintId).get();
  if (!complaintDoc.exists) {
    throw new Error("Complaint not found");
  }
  const complaint = { id: complaintDoc.id, ...complaintDoc.data() };
  const userId = complaint.user_id;
  const complaintTime = complaint.created_at?.toDate ? complaint.created_at.toDate() : new Date(complaint.created_at);

  // 2. Fetch User Profile
  const userDoc = await db.collection("users").doc(userId).get();
  const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

  // 3. Fetch Recent Payouts (manual sort to avoid index requirement)
  const payoutsSnapshot = await db.collection("payouts")
    .where("user_id", "==", userId)
    .get();
  const payouts = payoutsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return tb - ta;
    })
    .slice(0, 5);

  // 4. Fetch Fraud Alerts
  const alertsSnapshot = await db.collection("fraud_alerts")
    .where("user_id", "==", userId)
    .get();
  const fraud_alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 5. Fetch Relevant Events (within 24 hours of complaint)
  const startTime = new Date(complaintTime.getTime() - 24 * 60 * 60 * 1000);
  const endTime = new Date(complaintTime.getTime() + 24 * 60 * 60 * 1000);
  
  const eventsSnapshot = await db.collection("events")
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startTime))
    .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endTime))
    .get();
  const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    complaint,
    user,
    payouts,
    fraud_alerts,
    events
  };
}

/**
 * Sends structured context to Gemini AI and gets a decision.
 */
async function getAiDecision(context) {
  if (!GEMINI_API_KEY) {
    // Fallback if API key is missing
    return {
      decision: "review",
      confidence: 0,
      reasoning: "Gemini API Key missing. Manual review required."
    };
  }

  const prompt = `
Analyze the following complaint data and determine if it is "genuine", "fraudulent", or "needs_review".

Context JSON:
${JSON.stringify(context, null, 2)}

Instructions:
1. Is the complaint valid based on event data (rain/strike) and user location?
2. Should a payout be triggered based on payout history and complaint type?
3. Is this suspicious behavior based on fraud signals and trust score?

Return strictly in JSON format:
{
  "decision": "approved" | "rejected" | "review",
  "confidence": number,
  "reasoning": "string"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for consistent JSON output
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean up potential markdown formatting
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Decision Error:", error);
    return {
      decision: "review",
      confidence: 0,
      reasoning: "AI processing failed. Falling back to manual review."
    };
  }
}

/**
 * Executes the AI decision by updating Firestore and triggering payouts if necessary.
 */
async function executeDecision(complaintId, decisionData) {
  const db = admin.firestore();
  const complaintRef = db.collection("complaints").doc(complaintId);
  const complaintDoc = await complaintRef.get();
  
  if (!complaintDoc.exists) return;
  const complaintData = complaintDoc.data();

  // Prevent duplicate processing
  if (complaintData.status !== "pending") {
    return { success: false, message: "Complaint already processed" };
  }

  let updateStatus = "";
  let aiLabel = "";

  switch (decisionData.decision) {
    case "approved":
      updateStatus = "auto_resolved";
      aiLabel = "Approved";
      break;
    case "rejected":
      updateStatus = "rejected";
      aiLabel = "Rejected";
      break;
    case "review":
    default:
      updateStatus = "escalated";
      aiLabel = "Needs Manual Review";
      break;
  }

  const updatePayload = {
    status: updateStatus,
    ai_decision: aiLabel,
    confidence: decisionData.confidence,
    ai_reasoning: decisionData.reasoning,
    processed_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await complaintRef.update(updatePayload);

  // Trigger payout if approved
  if (decisionData.decision === "approved") {
    // Check if a payout was already triggered for this complaint to ensure idempotency
    const existingPayouts = await db.collection("payouts")
      .where("complaint_id", "==", complaintId)
      .get();

    if (existingPayouts.empty) {
      await db.collection("payouts").add({
        user_id: complaintData.user_id,
        complaint_id: complaintId,
        amount: 500, // Using a fixed value as per instruction fallback
        status: "processed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: "AI_AUTO_RESOLVE"
      });
    }
  }

  return { success: true, decision: aiLabel };
}

module.exports = {
  aggregateComplaintData,
  getAiDecision,
  executeDecision
};
