const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { initStore, readJson, writeJson, createId } = require('../common/store');
const { appendLog } = require('../common/logger');

// Set service-specific MongoDB database for data isolation
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = process.env.EVIDENCE_SERVICE_MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/evidence_service_db';
}

const app = express();
app.use(cors());
app.use(express.json());

const EVIDENCE_FILE = 'evidence.json';

app.post('/evidence', auth, (req, res) => {
  const { issueId, text, fileUrl } = req.body;
  if (!issueId || (!text && !fileUrl)) {
    return res.status(400).json({ error: 'issueId and either text or fileUrl are required' });
  }

  const evidence = {
    _id: createId(),
    issueId,
    userId: req.user._id,
    fileUrl: fileUrl || '',
    text: text || '',
    createdAt: new Date().toISOString(),
  };

  const all = readJson(EVIDENCE_FILE, []);
  all.push(evidence);
  writeJson(EVIDENCE_FILE, all);
  appendLog({ service: 'evidence-service', action: 'evidence_added', userId: req.user._id, issueId, details: { hasText: !!text, hasFileUrl: !!fileUrl } });

  return res.status(201).json(evidence);
});

app.get('/evidence/:issueId', auth, (req, res) => {
  const records = readJson(EVIDENCE_FILE, []).filter((item) => item.issueId === req.params.issueId);
  return res.json(records);
});

app.get('/health', (req, res) => {
  return res.json({ success: true, service: 'evidence-service' });
});

const start = async () => {
  await initStore();

  const PORT = Number(process.env.EVIDENCE_SERVICE_PORT || 5005);
  app.listen(PORT, () => {
    console.log(`Evidence Service running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error(`Evidence Service startup failed: ${error.message}`);
  process.exit(1);
});
