const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { readJson, writeJson, createId } = require('../common/store');
const { auth, signToken } = require('../common/auth');
const { appendLog, getLogs } = require('../common/logger');

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = 'users.json';
const NOTIFICATIONS_FILE = 'notifications.json';

const createNotification = ({ recipientId, type = 'general', title, message, link = '', actorId = null, issueId = null }) => ({
  _id: createId(),
  recipientId,
  type,
  title,
  message,
  link,
  actorId,
  issueId,
  isRead: false,
  createdAt: new Date().toISOString(),
});

const seedUsers = () => {
  const users = readJson(USERS_FILE, []);
  if (users.length > 0) return;

  const seedPassword = bcrypt.hashSync('password123', 10);
  writeJson(USERS_FILE, [
    { _id: createId(), name: 'System Admin', email: 'admin@campus.local', password: seedPassword, role: 'admin', department: 'General' },
    { _id: createId(), name: 'Academic Teacher', email: 'teacher@campus.local', password: seedPassword, role: 'teacher', department: 'Academics' },
    { _id: createId(), name: 'Hostel Warden', email: 'warden@campus.local', password: seedPassword, role: 'teacher', department: 'Hostel' },
    { _id: createId(), name: 'Department HOD', email: 'hod@campus.local', password: seedPassword, role: 'hod', department: 'Academics' },
    { _id: createId(), name: 'Dean Office', email: 'dean@campus.local', password: seedPassword, role: 'dean', department: 'General' },
    { _id: createId(), name: 'Campus Management', email: 'management@campus.local', password: seedPassword, role: 'management', department: 'General' },
  ]);
};

seedUsers();

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, department = 'General' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const users = readJson(USERS_FILE, []);
    const exists = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = { _id: createId(), name: name.trim(), email: email.toLowerCase(), password: hashed, role: 'student', department };
    users.push(user);
    writeJson(USERS_FILE, users);
    appendLog({ service: 'user-service', action: 'register', userId: user._id, details: { email: user.email } });

    const token = signToken(user);
    return res.status(201).json({ token, user: { ...user, password: undefined } });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to register user' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const users = readJson(USERS_FILE, []);
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    appendLog({ service: 'user-service', action: 'login', userId: user._id, details: { email: user.email } });
    return res.json({ token, user: { ...user, password: undefined } });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to login' });
  }
});

app.get('/auth/me', auth, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const user = users.find((item) => item._id === req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ ...user, password: undefined });
});

app.get('/users/authorities', (req, res) => {
  const level = Number(req.query.level || 1);
  const department = req.query.department;
  const users = readJson(USERS_FILE, []);

  let candidates = [];
  if (level === 1) {
    candidates = users.filter((item) => item.role === 'teacher');
  } else if (level === 2) {
    candidates = users.filter((item) => item.role === 'hod');
  } else if (level === 3) {
    candidates = users.filter((item) => item.role === 'dean');
  } else if (level >= 4) {
    candidates = users.filter((item) => item.role === 'management');
  } else {
    candidates = users.filter((item) => item.role === 'admin');
  }

  if (candidates.length === 0) {
    candidates = users.filter((item) => item.role === 'admin');
  }

  if (department) {
    const filtered = candidates.filter((item) => item.department.toLowerCase() === String(department).toLowerCase());
    candidates = filtered.length > 0 ? filtered : candidates;
  }

  return res.json(candidates.map((item) => ({ _id: item._id, name: item.name, role: item.role, department: item.department, email: item.email })));
});

app.get('/users/taggable', auth, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const taggableRoles = ['teacher', 'hod', 'dean', 'management', 'admin'];
  const taggable = users
    .filter((item) => taggableRoles.includes(item.role))
    .map((item) => ({ _id: item._id, name: item.name, role: item.role, department: item.department, email: item.email }));
  return res.json(taggable);
});

app.get('/users/directory', auth, (req, res) => {
  const users = readJson(USERS_FILE, []);
  return res.json(
    users.map((item) => ({
      _id: item._id,
      name: item.name,
      email: item.email,
      role: item.role,
      department: item.department,
    }))
  );
});

app.get('/users/notifications', auth, (req, res) => {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const mine = notifications
    .filter((item) => item.recipientId === req.user._id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    unreadCount: mine.filter((item) => !item.isRead).length,
    notifications: mine,
  });
});

app.patch('/users/notifications/:id/read', auth, (req, res) => {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const notification = notifications.find((item) => item._id === req.params.id && item.recipientId === req.user._id);

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.isRead = true;
  writeJson(NOTIFICATIONS_FILE, notifications);
  return res.json(notification);
});

app.post('/users/notifications/read-all', auth, (req, res) => {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  let changed = 0;

  notifications.forEach((item) => {
    if (item.recipientId === req.user._id && !item.isRead) {
      item.isRead = true;
      changed += 1;
    }
  });

  writeJson(NOTIFICATIONS_FILE, notifications);
  return res.json({ success: true, changed });
});

app.post('/notifications/internal', (req, res) => {
  const { recipientIds = [], type, title, message, link, actorId, issueId } = req.body || {};
  if (!Array.isArray(recipientIds) || recipientIds.length === 0 || !title || !message) {
    return res.status(400).json({ error: 'recipientIds, title and message are required' });
  }

  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const users = readJson(USERS_FILE, []);
  const validRecipientIds = new Set(users.map((item) => item._id));

  const created = recipientIds
    .filter((recipientId) => validRecipientIds.has(recipientId))
    .map((recipientId) => createNotification({ recipientId, type, title, message, link, actorId, issueId }));

  notifications.push(...created);
  writeJson(NOTIFICATIONS_FILE, notifications);

  return res.status(201).json({ created: created.length });
});

app.get('/users/logs', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can view logs' });
  }

  return res.json(getLogs());
});

const PORT = Number(process.env.USER_SERVICE_PORT || 5001);
app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
});
