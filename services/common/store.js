const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const ensureFile = (fileName, defaultData) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
  return filePath;
};

const readJson = (fileName, defaultData = []) => {
  const filePath = ensureFile(fileName, defaultData);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw || JSON.stringify(defaultData));
};

const writeJson = (fileName, data) => {
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
  readJson,
  writeJson,
  updateJson,
  createId,
};
