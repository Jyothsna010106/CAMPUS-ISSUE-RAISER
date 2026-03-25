const express = require('express');
const cors = require('cors');
const { initStore, readJson, writeJson, createId } = require('../common/store');

// Set service-specific MongoDB database for data isolation
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = process.env.SECTION_SERVICE_MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/section_service_db';
}

const app = express();
app.use(cors());
app.use(express.json());

const SECTIONS_FILE = 'sections.json';

const seedSections = () => {
  const current = readJson(SECTIONS_FILE, []);
  if (current.length > 0) return;

  writeJson(SECTIONS_FILE, [
    { _id: createId(), name: 'Academics', subSections: ['CS', 'AIML', 'ECE'] },
    { _id: createId(), name: 'Hostel', subSections: ['Boys Hostel', 'Girls Hostel'] },
    { _id: createId(), name: 'Transport', subSections: ['Route 1', 'Route 2'] },
    { _id: createId(), name: 'General', subSections: [] },
  ]);
};

const start = async () => {
  await initStore();
  seedSections();

  const PORT = Number(process.env.SECTION_SERVICE_PORT || 5002);
  app.listen(PORT, () => {
    console.log(`Section Service running on http://localhost:${PORT}`);
  });
};

app.get('/sections', (req, res) => {
  return res.json(readJson(SECTIONS_FILE, []));
});

app.get('/health', (req, res) => {
  return res.json({ success: true, service: 'section-service' });
});

start().catch((error) => {
  console.error(`Section Service startup failed: ${error.message}`);
  process.exit(1);
});
