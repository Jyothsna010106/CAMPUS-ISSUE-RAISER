const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_issue';
const dataDir = path.join(__dirname, '..', 'services', 'data');

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const StoreDocument = mongoose.models.StoreDocument || mongoose.model('StoreDocument', schema);

const files = [
  'users.json',
  'sections.json',
  'issues.json',
  'interactions.json',
  'evidence.json',
  'logs.json',
  'notifications.json',
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const run = async () => {
  await mongoose.connect(MONGO_URI);

  for (const fileName of files) {
    const filePath = path.join(dataDir, fileName);
    const payload = readJson(filePath);

    await StoreDocument.updateOne(
      { key: fileName },
      { $set: { data: payload } },
      { upsert: true }
    );

    console.log(`Loaded ${fileName} (${Array.isArray(payload) ? payload.length : 1} records)`);
  }

  await mongoose.disconnect();
  console.log('Mongo seed completed from JSON snapshot.');
};

run().catch(async (error) => {
  console.error(`Mongo seed failed: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failures
  }
  process.exit(1);
});
