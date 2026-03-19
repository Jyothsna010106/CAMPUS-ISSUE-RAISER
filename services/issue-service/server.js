const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { readJson, writeJson, createId } = require('../common/store');
const { requestJson } = require('../common/http');
const { appendLog } = require('../common/logger');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const ISSUES_FILE = 'issues.json';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

const validStatuses = ['Open', 'Seen', 'In Progress', 'Resolved', 'Escalated'];

const notifyTaggedAuthorities = async ({ taggedAuthorityIds, issueId, issueTitle, actorName, actorId }) => {
  if (!Array.isArray(taggedAuthorityIds) || taggedAuthorityIds.length === 0) {
    return;
  }

  await requestJson(USER_SERVICE_URL, '/notifications/internal', {
    method: 'POST',
    body: JSON.stringify({
      recipientIds: taggedAuthorityIds,
      type: 'issue_tagged',
      title: 'You were tagged in an issue',
      message: `${actorName || 'A user'} tagged you in "${issueTitle}"`,
      link: `/issues/${issueId}`,
      actorId,
      issueId,
    }),
  });
};

const maskIssueForViewer = (issue, viewer) => {
  if (!issue?.isAnonymous) {
    return issue;
  }

  const isOwner = viewer?._id === issue.createdBy;
  const isAdmin = viewer?.role === 'admin';

  if (isOwner || isAdmin) {
    return issue;
  }

  return {
    ...issue,
    createdBy: null,
  };
};

app.post('/issues', auth, async (req, res) => {
  try {
    const { title, description, sectionId, tags = [], taggedAuthorityIds = [], imageUrl = '', isAnonymous = false } = req.body;
    if (!title || !description || !sectionId) {
      return res.status(400).json({ error: 'title, description and sectionId are required' });
    }

    let assignedTo = null;
    try {
      const authorities = await requestJson(USER_SERVICE_URL, `/users/authorities?level=1&department=${encodeURIComponent(req.user.department || 'General')}`);
      assignedTo = authorities[0]?._id || null;
    } catch (error) {
      assignedTo = null;
    }

    const issue = {
      _id: createId(),
      title: title.trim(),
      description: description.trim(),
      sectionId,
      tags: Array.isArray(tags) ? tags : [],
      taggedAuthorityIds: Array.isArray(taggedAuthorityIds) ? taggedAuthorityIds : [],
      imageUrl: String(imageUrl || '').trim(),
      isAnonymous: Boolean(isAnonymous),
      createdBy: req.user._id,
      createdByDepartment: req.user.department || 'General',
      assignedTo,
      escalationLevel: 1,
      status: 'Open',
      supportCount: 0,
      createdAt: new Date().toISOString(),
    };

    const issues = readJson(ISSUES_FILE, []);
    issues.push(issue);
    writeJson(ISSUES_FILE, issues);
    appendLog({ service: 'issue-service', action: 'issue_created', userId: req.user._id, issueId: issue._id, details: { sectionId, tags: issue.tags, taggedAuthorityIds: issue.taggedAuthorityIds } });

    try {
      await notifyTaggedAuthorities({
        taggedAuthorityIds: issue.taggedAuthorityIds,
        issueId: issue._id,
        issueTitle: issue.title,
        actorName: req.user.name,
        actorId: req.user._id,
      });
    } catch (notifyError) {
      appendLog({
        service: 'issue-service',
        action: 'tag_notification_failed',
        userId: req.user._id,
        issueId: issue._id,
        details: { message: notifyError.message },
      });
    }

    return res.status(201).json(maskIssueForViewer(issue, req.user));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create issue' });
  }
});

app.get('/issues', auth, (req, res) => {
  const { sectionId, status, tag } = req.query;
  let issues = readJson(ISSUES_FILE, []);

  if (sectionId) issues = issues.filter((item) => item.sectionId === sectionId);
  if (status) issues = issues.filter((item) => item.status === status);
  if (tag) issues = issues.filter((item) => item.tags.includes(tag));

  issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(issues.map((issue) => maskIssueForViewer(issue, req.user)));
});

app.get('/issues/:id', auth, (req, res) => {
  const issue = readJson(ISSUES_FILE, []).find((item) => item._id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  return res.json(maskIssueForViewer(issue, req.user));
});

app.patch('/issues/:id/status', (req, res) => {
  const { status } = req.body;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const issues = readJson(ISSUES_FILE, []);
  const issue = issues.find((item) => item._id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.status = status;
  writeJson(ISSUES_FILE, issues);
  appendLog({ service: 'issue-service', action: 'issue_status_updated', issueId: issue._id, details: { status } });
  return res.json(issue);
});

app.patch('/issues/:id/support', (req, res) => {
  const delta = Number(req.body.delta || 1);
  const issues = readJson(ISSUES_FILE, []);
  const issue = issues.find((item) => item._id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.supportCount = Math.max(0, issue.supportCount + delta);
  writeJson(ISSUES_FILE, issues);
  appendLog({ service: 'issue-service', action: 'issue_support_count_changed', issueId: issue._id, details: { delta, supportCount: issue.supportCount } });
  return res.json(issue);
});

app.patch('/issues/:id/escalate', (req, res) => {
  const { escalationLevel, assignedTo } = req.body;
  const issues = readJson(ISSUES_FILE, []);
  const issue = issues.find((item) => item._id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.escalationLevel = escalationLevel;
  issue.assignedTo = assignedTo;
  issue.status = 'Escalated';

  writeJson(ISSUES_FILE, issues);
  appendLog({ service: 'issue-service', action: 'issue_escalated', issueId: issue._id, details: { escalationLevel, assignedTo } });
  return res.json(issue);
});

const PORT = Number(process.env.ISSUE_SERVICE_PORT || 5003);
app.listen(PORT, () => {
  console.log(`Issue Service running on http://localhost:${PORT}`);
});
