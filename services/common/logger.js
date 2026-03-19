const { readJson, writeJson, createId } = require('./store');

const LOG_FILE = 'logs.json';

const appendLog = ({ service, action, userId = null, issueId = null, details = {} }) => {
  const logs = readJson(LOG_FILE, []);
  logs.push({
    _id: createId(),
    service,
    action,
    userId,
    issueId,
    details,
    createdAt: new Date().toISOString(),
  });
  writeJson(LOG_FILE, logs);
};

const getLogs = () => {
  return readJson(LOG_FILE, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

module.exports = {
  appendLog,
  getLogs,
};
