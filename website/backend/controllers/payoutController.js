const admin = require("firebase-admin");
const { logEvent } = require("../services/auditService");
const {
  buildPredictivePayoutPlan,
} = require("../services/payoutPredictionService");

/**
 * IMPORTANT: PAYOUT RECORDS MUST NEVER BE DELETED.
 * Status changes (Approve, Reject) must only modify the 'status' field.
 */

// Get all payouts
exports.getAllPayouts = async (req, res) => {
  try {
    const db = admin.firestore();
    const payoutsSnapshot = await db
      .collection("payouts")
      .orderBy("timestamp", "desc")
      .get();
    const payouts = payoutsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve payout history" });
  }
};

// Approve/Reject payout
exports.updatePayoutStatus = async (req, res) => {
  const { payoutId } = req.params;
  const { status, remarks } = req.body; // e.g., 'approved', 'rejected'
  const adminId = req.user.uid;

  const validStatuses = [
    "approved",
    "rejected",
    "pending",
    "failed",
    "Processing",
    "Completed",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid payout status" });
  }

  try {
    const db = admin.firestore();
    const payoutRef = db.collection("payouts").doc(payoutId);
    const payoutDoc = await payoutRef.get();

    if (!payoutDoc.exists) {
      return res.status(404).json({ error: "Payout record not found" });
    }

    const payoutData = payoutDoc.data();
    if (payoutData.status === "approved" && status !== "approved") {
      return res
        .status(400)
        .json({
          error: "Cannot modify a payout that has already been approved",
        });
    }

    await payoutRef.update({
      status,
      remarks: remarks || "",
      processed_at: admin.firestore.FieldValue.serverTimestamp(),
      processed_by: adminId,
    });

    // Log the action
    await logEvent(adminId, "PAYOUT_STATUS_UPDATE", payoutId, {
      oldStatus: payoutData.status,
      newStatus: status,
      amount: payoutData.amount,
      userId: payoutData.userId,
    });

    res.json({
      success: true,
      message: `Payout marked as ${status.toUpperCase()}`,
    });
  } catch (error) {
    // Silent error

    res.status(500).json({ error: "System error during payout processing" });
  }
};

exports.getPrediction = async (req, res) => {
  try {
    const report = await buildPredictivePayoutPlan();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate payout prediction" });
  }
};
