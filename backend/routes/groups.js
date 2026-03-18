const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { createGroup, listGroups, getGroup } = require('../controllers/groupController');

router.post('/', auth, authorize(['admin', 'superadmin']), createGroup);
router.get('/', auth, listGroups);
router.get('/:id', auth, getGroup);

module.exports = router;
