const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { weeklySummary } = require('../controllers/reportController');

router.get('/weekly', auth, authorize(['admin', 'superadmin', 'authority']), weeklySummary);

module.exports = router;
