const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { readJson, writeJson, createId } = require('../common/store');
const { requestJson } = require('../common/http');
const { appendLog } = require('../common/logger');

const app = express();
app.use(cors());
app.use(express.json());

const INTERACTIONS_FILE = 'interactions.json';
const ISSUE_SERVICE_URL = process.env.ISSUE_SERVICE_URL || 'http://localhost:5003';

app.post('/interactions/support', auth, async (req, res) => {
  try {
    const { issueId } = req.body;
    if (!issueId) {
      return res.status(400).json({ error: 'issueId is required' });
    }

    const all = readJson(INTERACTIONS_FILE, []);
    const exists = all.find((item) => item.issueId === issueId && item.userId === req.user._id && item.type === 'support');
    if (exists) {
      return res.status(409).json({ error: 'Support already added' });
    }

    const interaction = {
      _id: createId(),
      issueId,
      userId: req.user._id,
      type: 'support',
      content: '',
      createdAt: new Date().toISOString(),
    };

    all.push(interaction);
    writeJson(INTERACTIONS_FILE, all);

    await requestJson(ISSUE_SERVICE_URL, `/issues/${issueId}/support`, {
      method: 'PATCH',
      body: JSON.stringify({ delta: 1 }),
    });

    appendLog({ service: 'interaction-service', action: 'issue_supported', userId: req.user._id, issueId, details: { type: 'support' } });

    return res.status(201).json(interaction);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to add support' });
  }
});

app.post('/interactions/comment', auth, (req, res) => {
  const { issueId, content } = req.body;
  if (!issueId || !content) {
    return res.status(400).json({ error: 'issueId and content are required' });
  }

  const comment = {
    _id: createId(),
    issueId,
    userId: req.user._id,
    type: 'comment',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const interactions = readJson(INTERACTIONS_FILE, []);
  interactions.push(comment);
  writeJson(INTERACTIONS_FILE, interactions);
  appendLog({ service: 'interaction-service', action: 'issue_commented', userId: req.user._id, issueId, details: { contentLength: comment.content.length } });

  return res.status(201).json(comment);
});

app.get('/interactions/:issueId', auth, (req, res) => {
  const issueId = req.params.issueId;
  const interactions = readJson(INTERACTIONS_FILE, []).filter((item) => item.issueId === issueId);
  return res.json(interactions);
});

const PORT = Number(process.env.INTERACTION_SERVICE_PORT || 5004);
app.listen(PORT, () => {
  console.log(`Interaction Service running on http://localhost:${PORT}`);
});
