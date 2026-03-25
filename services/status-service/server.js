const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { requestJson } = require('../common/http');
const { appendLog } = require('../common/logger');

// Set service-specific MongoDB database for data isolation
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = process.env.STATUS_SERVICE_MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/status_service_db';
}

const app = express();
app.use(cors());
app.use(express.json());

const ISSUE_SERVICE_URL = process.env.ISSUE_SERVICE_URL || 'http://localhost:5003';
const validStatuses = ['Open', 'Seen', 'In Progress', 'Resolved', 'Escalated'];

app.put('/issues/:id/status', auth, async (req, res) => {
  try {
    const issueId = req.params.id;
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update status' });
    }

    const issue = await requestJson(ISSUE_SERVICE_URL, `/issues/${issueId}`, {
      headers: { Authorization: req.headers.authorization || '' },
    });

    const updated = await requestJson(ISSUE_SERVICE_URL, `/issues/${issueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    appendLog({
      service: 'status-service',
      action: 'admin_status_updated',
      userId: req.user._id,
      issueId: issue._id,
      details: { previousStatus: issue.status, newStatus: status },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(error.status || 500).json(error.body || { error: 'Unable to update status' });
  }
});

app.get('/health', (req, res) => {
  return res.json({ success: true, service: 'status-service' });
});

const PORT = Number(process.env.STATUS_SERVICE_PORT || 5007);
app.listen(PORT, () => {
  console.log(`Status Service running on http://localhost:${PORT}`);
});
