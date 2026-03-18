const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { addComment, listComments } = require('../controllers/commentController');

router.post('/', auth, addComment);
router.get('/', auth, listComments);

module.exports = router;
