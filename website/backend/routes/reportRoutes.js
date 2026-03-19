const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Reports typically restricted to admin and analysts
router.get('/:collection/:format', checkRole(['analyst', 'admin']), reportController.downloadReport);

module.exports = router;
