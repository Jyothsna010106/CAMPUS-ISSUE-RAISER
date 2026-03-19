const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '..', 'data');
const cache = new Map();

const storeMode = String(process.env.STORE_MODE || '').toLowerCase();
const useMongo = storeMode === 'mongo' || Boolean(process.env.MONGO_URI);
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_issue';

let initializedPromise = null;
let StoreDocument = null;

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureStoreModel = () => {
  if (StoreDocument) {
    return StoreDocument;
  }

  const schema = new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
  );

  StoreDocument = mongoose.models.StoreDocument || mongoose.model('StoreDocument', schema);
  return StoreDocument;
};

const initStore = async () => {
  if (!useMongo) {
    return;
  }

  if (initializedPromise) {
    return initializedPromise;
  }

  initializedPromise = (async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log(`[store] MongoDB connected: ${mongoUri}`);
    }

    const Model = ensureStoreModel();
    const documents = await Model.find({}).lean();
    documents.forEach((document) => {
      cache.set(document.key, clone(document.data));
    });
  })();

  return initializedPromise;
};

const ensureFile = (fileName, defaultData) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
  return filePath;
};

const readJson = (fileName, defaultData = []) => {
  if (cache.has(fileName)) {
    return clone(cache.get(fileName));
  }

  if (useMongo) {
    cache.set(fileName, clone(defaultData));
    return clone(defaultData);
  }

  const filePath = ensureFile(fileName, defaultData);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw || JSON.stringify(defaultData));
  cache.set(fileName, clone(parsed));
  return parsed;
};

const writeJson = (fileName, data) => {
  cache.set(fileName, clone(data));

  if (useMongo) {
    const Model = ensureStoreModel();
    Model.updateOne({ key: fileName }, { $set: { data: clone(data) } }, { upsert: true })
      .catch((error) => {
        console.error(`[store] Failed writing ${fileName} to MongoDB: ${error.message}`);
      });
    return data;
  }

  const filePath = ensureFile(fileName, data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return data;
};

const updateJson = (fileName, defaultData, updater) => {
  const current = readJson(fileName, defaultData);
  const updated = updater(current);
  writeJson(fileName, updated);
  return updated;
};

const createId = () => crypto.randomUUID();

module.exports = {
  initStore,
  readJson,
  writeJson,
  updateJson,
  createId,
};
