const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All rider routes require at least 'support' role
router.use(verifyToken);

router.get('/', checkRole(['support', 'analyst', 'admin']), userController.getAllRiders);
router.patch('/:userId/status', checkRole(['analyst', 'admin']), userController.updateRiderStatus);

module.exports = router;
