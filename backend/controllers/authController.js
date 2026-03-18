const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const College = require('../models/College');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', collegeCode, groupId } = req.body;
    if (!name || !email || !password || !collegeCode) {
      return res.status(400).json({ error: 'Name, email, password and college code are required' });
    }

    const college = await College.findOne({ uniqueCode: collegeCode.toUpperCase().trim() });
    if (!college) return res.status(404).json({ error: 'College not found' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hash, role, collegeId: college._id, groupId });

    res.status(201).json({ token: generateToken(user._id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.me = async (req, res) => {
  res.json(req.user);
};
