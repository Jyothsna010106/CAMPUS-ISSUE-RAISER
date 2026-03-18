const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createIssue,
  getIssues,
  getIssue,
  updateIssueStatus,
  upvoteIssue,
  escalateIssue,
} = require('../controllers/issueController');

router.post('/', auth, authorize(['student', 'authority', 'admin', 'superadmin']), createIssue);
router.get('/', auth, getIssues);
router.get('/:id', auth, getIssue);
router.patch('/:id/status', auth, authorize(['authority', 'admin', 'superadmin']), updateIssueStatus);
router.post('/:id/upvote', auth, authorize(['student', 'authority', 'admin', 'superadmin']), upvoteIssue);
router.post('/:id/escalate', auth, authorize(['admin', 'superadmin']), escalateIssue);

module.exports = router;
