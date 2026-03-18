const Issue = require('../models/Issue');

exports.weeklySummary = async (req, res) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const collegeId = req.query.collegeId;
  const match = { createdAt: { $gte: oneWeekAgo } };
  if (collegeId) match.collegeId = collegeId;

  const topIssues = await Issue.find(match)
    .sort({ upvotes: -1 })
    .limit(5)
    .select('title upvotes status category');

  const counts = await Issue.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const activeGroups = await Issue.aggregate([
    { $match: match },
    { $group: { _id: '$groupId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.json({ topIssues, statusCounts: counts, activeGroups });
};
