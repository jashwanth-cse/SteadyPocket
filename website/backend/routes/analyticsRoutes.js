const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/fraud', checkRole(['support', 'analyst', 'admin']), analyticsController.getFraudAnalytics);
router.get('/predictions', checkRole(['support', 'analyst', 'admin']), analyticsController.getPredictions);

module.exports = router;