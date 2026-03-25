require('dotenv').config();
const mongoose = require('mongoose');

const oldUri = 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/campus_issue';

const targets = {
  'users.json': process.env.USER_SERVICE_MONGO_URI,
  'notifications.json': process.env.USER_SERVICE_MONGO_URI,
  'sections.json': process.env.SECTION_SERVICE_MONGO_URI,
  'issues.json': process.env.ISSUE_SERVICE_MONGO_URI,
  'interactions.json': process.env.INTERACTION_SERVICE_MONGO_URI,
  'evidence.json': process.env.EVIDENCE_SERVICE_MONGO_URI,
  'logs.json': process.env.ANALYTICS_SERVICE_MONGO_URI,
};

async function run() {
  const oldConn = await mongoose.createConnection(oldUri).asPromise();
  const oldCol = oldConn.db.collection('storedocuments');
  const keys = Object.keys(targets);
  const docs = await oldCol.find({ key: { $in: keys } }).toArray();

  console.log(`Found ${docs.length} legacy datasets`);

  for (const doc of docs) {
    const uri = targets[doc.key];
    if (!uri) {
      console.log(`Skip ${doc.key}: no target`);
      continue;
    }

    const conn = await mongoose.createConnection(uri).asPromise();
    const col = conn.db.collection('storedocuments');
    await col.updateOne(
      { key: doc.key },
      {
        $set: {
          key: doc.key,
          data: doc.data,
          updatedAt: new Date(),
          migratedFrom: 'campus_issue',
        },
      },
      { upsert: true }
    );

    const count = Array.isArray(doc.data) ? doc.data.length : 1;
    console.log(`Migrated ${doc.key} -> ${conn.db.databaseName} (${count} records)`);
    await conn.close();
  }

  await oldConn.close();
  console.log('Migration complete');
}

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
