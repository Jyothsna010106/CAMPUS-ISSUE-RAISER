const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { createCollege, getColleges, getCollege, assignCollegeAdmin } = require('../controllers/collegeController');

router.post('/', auth, authorize(['superadmin']), createCollege);
router.get('/', auth, getColleges);
router.get('/:id', auth, getCollege);
router.post('/:id/assign-admin', auth, authorize(['superadmin']), assignCollegeAdmin);

module.exports = router;
