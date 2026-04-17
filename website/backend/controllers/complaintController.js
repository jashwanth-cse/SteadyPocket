const admin = require("firebase-admin");
const aiService = require("../services/aiComplaintService");

/**
 * Get all complaints for the admin dashboard.
 */
exports.getAllComplaints = async (req, res) => {
  try {
    const db = admin.firestore();
    const complaintsSnapshot = await db.collection("complaints")
      .orderBy("created_at", "desc")
      .get();
    
    const complaints = complaintsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(complaints);
  } catch (error) {
    console.error("Fetch Complaints Error:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

/**
 * Analyze a single complaint using AI.
 */
exports.analyzeComplaint = async (req, res) => {
  const { complaintId } = req.params;
  
  try {
    // 1. Aggregate Data
    const context = await aiService.aggregateComplaintData(complaintId);
    
    // 2. Get AI Decision
    const decision = await aiService.getAiDecision(context);
    
    // 3. Execute Decision
    const result = await aiService.executeDecision(complaintId, decision);
    
    res.json({
      success: true,
      complaintId,
      ai_decision: result.decision,
      details: decision
    });
  } catch (error) {
    console.error("Analyze Complaint Error:", error);
    res.status(500).json({ error: "Failed to analyze complaint" });
  }
};

/**
 * Analyze all pending complaints.
 */
exports.analyzeAllComplaints = async (req, res) => {
  try {
    const db = admin.firestore();
    const pendingSnapshot = await db.collection("complaints")
      .where("status", "==", "pending")
      .get();
    
    if (pendingSnapshot.empty) {
      return res.json({ message: "No pending complaints to analyze" });
    }

    const results = [];
    for (const doc of pendingSnapshot.docs) {
      const complaintId = doc.id;
      try {
        const context = await aiService.aggregateComplaintData(complaintId);
        const decision = await aiService.getAiDecision(context);
        const result = await aiService.executeDecision(complaintId, decision);
        results.push({ complaintId, success: true, decision: result.decision });
      } catch (err) {
        console.error(`Error analyzing complaint ${complaintId}:`, err);
        results.push({ complaintId, success: false, error: err.message });
      }
    }
    
    res.json({
      message: `Processed ${results.length} complaints`,
      results
    });
  } catch (error) {
    console.error("Batch Analyze Error:", error);
    res.status(500).json({ error: "Failed to perform batch analysis" });
  }
};
