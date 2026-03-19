const express = require('express');
const cors = require('cors');
const { readJson, writeJson, createId } = require('../common/store');

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

seedSections();

app.get('/sections', (req, res) => {
  return res.json(readJson(SECTIONS_FILE, []));
});

const PORT = Number(process.env.SECTION_SERVICE_PORT || 5002);
app.listen(PORT, () => {
  console.log(`Section Service running on http://localhost:${PORT}`);
});
