require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const targets = [
    ['escalation_service_db', process.env.ESCALATION_SERVICE_MONGO_URI],
    ['status_service_db', process.env.STATUS_SERVICE_MONGO_URI],
  ];

  for (const [name, uri] of targets) {
    if (!uri) {
      console.log(`missing URI for ${name}`);
      continue;
    }

    const conn = await mongoose.createConnection(uri).asPromise();
    const col = conn.db.collection('service_meta');
    await col.updateOne(
      { service: name },
      {
        $set: {
          service: name,
          initializedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    console.log(`initialized ${name}`);
    await conn.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
