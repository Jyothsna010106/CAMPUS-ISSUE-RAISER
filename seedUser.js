const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const STORE_MODE = String(process.env.STORE_MODE || '').toLowerCase();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_issue';
const useMongo = STORE_MODE === 'mongo' || Boolean(process.env.MONGO_URI);

const DATA_DIR = path.join(__dirname, 'services', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const StoreDocument = mongoose.models.StoreDocument || mongoose.model('StoreDocument', schema);

const readUsersFromFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }

  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
};

const writeUsersToFile = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const readUsersFromMongo = async () => {
  await mongoose.connect(MONGO_URI);
  const doc = await StoreDocument.findOne({ key: 'users.json' }).lean();
  return Array.isArray(doc?.data) ? doc.data : [];
};

const writeUsersToMongo = async (users) => {
  await StoreDocument.updateOne(
    { key: 'users.json' },
    { $set: { data: users } },
    { upsert: true }
  );
};

const run = async () => {
  const name = (process.env.SEED_USER_NAME || 'Microservice Seed User').trim();
  const email = (process.env.SEED_USER_EMAIL || 'seed.user@campus.local').toLowerCase().trim();
  const password = process.env.SEED_USER_PASSWORD || 'password123';
  const role = (process.env.SEED_USER_ROLE || 'student').toLowerCase().trim();
  const department = (process.env.SEED_USER_DEPARTMENT || 'General').trim();

  if (!email || !password || !name) {
    throw new Error('SEED_USER_NAME, SEED_USER_EMAIL and SEED_USER_PASSWORD are required');
  }

  const users = useMongo ? await readUsersFromMongo() : readUsersFromFile();
  const exists = users.find((user) => String(user.email || '').toLowerCase() === email);

  if (exists) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  users.push({
    _id: crypto.randomUUID(),
    name,
    email,
    password: hash,
    role,
    department,
  });

  if (useMongo) {
    await writeUsersToMongo(users);
    console.log(`User seeded in Mongo store: ${email}`);
  } else {
    writeUsersToFile(users);
    console.log(`User seeded in file store: ${email}`);
  }
};

run()
  .catch((error) => {
    console.error(`seedUser failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
