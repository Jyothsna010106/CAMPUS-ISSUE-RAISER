const Comment = require('../models/Comment');

exports.addComment = async (req, res) => {
  try {
    const { issueId, text } = req.body;
    if (!issueId || !text) return res.status(400).json({ error: 'issueId and text required' });

    const comment = await Comment.create({ issueId, userId: req.user._id, text });
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listComments = async (req, res) => {
  const filter = { issueId: req.query.issueId };
  if (!filter.issueId) return res.status(400).json({ error: 'issueId required' });

  const comments = await Comment.find(filter).populate('userId', 'name role');
  res.json(comments);
};
