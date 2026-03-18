const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  const uri = 'mongodb://127.0.0.1:27017/campus_issue_system';
  await mongoose.connect(uri);

  const College = require('./backend/models/College');
  const User = require('./backend/models/User');

  const code = 'SRINIVAS';
  let college = await College.findOne({ uniqueCode: code });
  if (!college) {
    college = await College.create({ name: 'Srinivas Institute', uniqueCode: code });
    console.log('College inserted', college._id.toString());
  } else {
    console.log('College already exists', college._id.toString());
  }

  const email = 'jyothsnajogi886@gmail.com';
  let user = await User.findOne({ email });
  if (!user) {
    const hash = await bcrypt.hash('P@ssw0rd123', 10);
    user = await User.create({
      name: 'Jyothsna R Jogi',
      email,
      password: hash,
      role: 'student',
      collegeId: college._id,
      groupId: null,
    });
    console.log('User inserted', user._id.toString());
  } else {
    console.log('User already exists', user._id.toString());
  }

  await mongoose.disconnect();
  console.log('Done.');
})();
