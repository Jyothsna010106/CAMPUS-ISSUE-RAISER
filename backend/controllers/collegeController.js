const College = require('../models/College');
const User = require('../models/User');

exports.createCollege = async (req, res) => {
  try {
    const { name, uniqueCode } = req.body;
    if (!name || !uniqueCode) return res.status(400).json({ error: 'name and uniqueCode required' });

    const exists = await College.findOne({ uniqueCode: uniqueCode.toUpperCase().trim() });
    if (exists) return res.status(400).json({ error: 'college code already exists' });

    const college = await College.create({ name, uniqueCode: uniqueCode.toUpperCase().trim() });
    res.status(201).json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getColleges = async (req, res) => {
  const colleges = await College.find();
  res.json(colleges);
};

exports.getCollege = async (req, res) => {
  const college = await College.findById(req.params.id);
  if (!college) return res.status(404).json({ error: 'College not found' });
  res.json(college);
};

exports.assignCollegeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const college = await College.findById(id);
    if (!college) return res.status(404).json({ error: 'College not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.collegeId.toString() !== id) return res.status(400).json({ error: 'User must be in same college' });

    user.role = 'admin';
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
