const Group = require('../models/Group');

exports.createGroup = async (req, res) => {
  try {
    const { name, collegeId } = req.body;
    if (!name || !collegeId) return res.status(400).json({ error: 'name and collegeId required' });

    const existing = await Group.findOne({ name: name.trim(), collegeId });
    if (existing) return res.status(400).json({ error: 'Group already exists for this college' });

    const group = await Group.create({ name: name.trim(), collegeId });
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listGroups = async (req, res) => {
  const filter = {};
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  const groups = await Group.find(filter);
  res.json(groups);
};

exports.getGroup = async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
};
