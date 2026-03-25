const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { requestJson } = require('../common/http');
const { appendLog } = require('../common/logger');

// Set service-specific MongoDB database for data isolation
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = process.env.ESCALATION_SERVICE_MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/escalation_service_db';
}

const app = express();
app.use(cors());
app.use(express.json());

const ISSUE_SERVICE_URL = process.env.ISSUE_SERVICE_URL || 'http://localhost:5003';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

app.put('/issues/:id/escalate', auth, async (req, res) => {
  try {
    const issueId = req.params.id;
    const issue = await requestJson(ISSUE_SERVICE_URL, `/issues/${issueId}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });

    if (issue.status === 'Resolved') {
      return res.status(400).json({ error: 'Resolved issues cannot be escalated' });
    }

    if (issue.assignedTo && issue.assignedTo === req.user._id) {
      return res.status(403).json({ error: 'Assigned authority cannot escalate own issue' });
    }

    const nextLevel = Math.min(4, Number(issue.escalationLevel || 1) + 1);
    const candidates = await requestJson(USER_SERVICE_URL, `/users/authorities?level=${nextLevel}&department=${encodeURIComponent(req.user.department || 'General')}`);
    const assignedTo = candidates[0]?._id || issue.assignedTo;

    const updated = await requestJson(ISSUE_SERVICE_URL, `/issues/${issueId}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ escalationLevel: nextLevel, assignedTo }),
    });

    appendLog({
      service: 'escalation-service',
      action: 'issue_escalated',
      userId: req.user._id,
      issueId: issue._id,
      details: { previousLevel: issue.escalationLevel, newLevel: nextLevel, assignedTo },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(error.status || 500).json(error.body || { error: 'Unable to escalate issue' });
  }
});

app.get('/health', (req, res) => {
  return res.json({ success: true, service: 'escalation-service' });
});

const PORT = Number(process.env.ESCALATION_SERVICE_PORT || 5006);
app.listen(PORT, () => {
  console.log(`Escalation Service running on http://localhost:${PORT}`);
});
