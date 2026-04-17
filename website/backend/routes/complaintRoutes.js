const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
// const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// Note: Re-enabling auth in production
// router.use(verifyToken);

router.get("/", complaintController.getAllComplaints);
router.post("/analyze/:complaintId", complaintController.analyzeComplaint);
router.post("/analyze-all", complaintController.analyzeAllComplaints);

module.exports = router;
