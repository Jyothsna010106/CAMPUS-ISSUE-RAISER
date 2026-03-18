const Issue = require('../models/Issue');
const Comment = require('../models/Comment');

exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, collegeId, groupId, taggedAuthority, evidence, anonymous } = req.body;
    if (!title || !description || !collegeId || !groupId) return res.status(400).json({ error: 'required fields missing' });

    const issue = await Issue.create({
      title: title.trim(),
      description,
      category: category || 'other',
      collegeId,
      groupId,
      createdBy: req.user._id,
      taggedAuthority,
      evidence: evidence || [],
      anonymous: !!anonymous,
    });

    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getIssues = async (req, res) => {
  const { category, status, groupId, collegeId, sortBy = 'createdAt' } = req.query;
  const filter = {};
  if (collegeId) filter.collegeId = collegeId;
  if (groupId) filter.groupId = groupId;
  if (category) filter.category = category;
  if (status) filter.status = status;

  let query = Issue.find(filter)
    .populate('createdBy', 'name role email')
    .populate('taggedAuthority', 'name email')
    .populate('groupId', 'name')
    .populate('collegeId', 'name uniqueCode');

  if (sortBy === 'mostUpvoted') query = query.sort({ upvotes: -1 });
  else query = query.sort({ [sortBy]: -1 });

  const issues = await query;
  res.json(issues);
};

exports.getIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('taggedAuthority', 'name email role')
    .populate('groupId', 'name')
    .populate('collegeId', 'name uniqueCode');

  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const comments = await Comment.find({ issueId: issue._id }).populate('userId', 'name role');
  res.json({ issue, comments });
};

exports.updateIssueStatus = async (req, res) => {
  const { status, escalationLevel } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  if (status) issue.status = status;
  if (Number.isInteger(escalationLevel)) issue.escalationLevel = escalationLevel;
  await issue.save();

  res.json(issue);
};

exports.upvoteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  if (issue.upvotedBy.includes(req.user._id)) return res.status(400).json({ error: 'Already upvoted' });
  issue.upvotes += 1;
  issue.upvotedBy.push(req.user._id);
  await issue.save();

  res.json(issue);
};

exports.escalateIssue = async (req, res) => {
  const { levelIncrement = 1 } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  issue.escalationLevel += Number(levelIncrement);
  await issue.save();
  res.json(issue);
};
