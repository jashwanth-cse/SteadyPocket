const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// auth required
router.use(verifyToken);

router.get('/', checkRole(['analyst', 'admin']), fraudController.getAllAlerts);
router.patch('/:alertId', checkRole(['analyst', 'admin']), fraudController.updateAlertStatus);

module.exports = router;
