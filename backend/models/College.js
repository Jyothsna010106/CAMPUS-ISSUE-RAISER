const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  uniqueCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('College', CollegeSchema);
