const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// auth required
router.use(verifyToken);

router.get('/', checkRole(['support', 'analyst', 'admin']), payoutController.getAllPayouts);
router.patch('/:payoutId', checkRole(['admin']), payoutController.updatePayoutStatus); // Approval restricted to admin

module.exports = router;
