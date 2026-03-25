#!/usr/bin/env node
/**
 * Seed all microservice data into MongoDB Atlas
 * Each service owns its data independently
 * 
 * Service Data Grouping:
 * - User Service: users.json, notifications.json
 * - Section Service: sections.json
 * - Issue Service: issues.json, interactions.json
 * - Evidence Service: evidence.json
 * - Logs Service: logs.json
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/campus_issue';
const dataDir = path.join(__dirname, 'services', 'data');

// Service data grouping
const serviceDataMap = {
  'user-service': ['users.json', 'notifications.json'],
  'section-service': ['sections.json'],
  'issue-service': ['issues.json', 'interactions.json'],
  'evidence-service': ['evidence.json'],
  'logs-service': ['logs.json'],
};

let StoreDocument = null;

const ensureStoreModel = () => {
  if (StoreDocument) {
    return StoreDocument;
  }

  const schema = new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      service: { type: String }, // Track which service owns this data
    },
    { timestamps: true }
  );

  StoreDocument = mongoose.models.StoreDocument || mongoose.model('StoreDocument', schema);
  return StoreDocument;
};

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB Atlas');

    const Model = ensureStoreModel();

    // Seed data by service
    let totalSeeded = 0;

    for (const [service, files] of Object.entries(serviceDataMap)) {
      console.log(`\n📦 Seeding ${service}:`);

      for (const file of files) {
        const filePath = path.join(dataDir, file);

        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠ File not found: ${file}`);
          continue;
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);

        // Upsert data into MongoDB
        const key = file; // Use filename as key (e.g., "users.json")
        await Model.updateOne(
          { key },
          {
            $set: {
              key,
              data,
              service, // Track which service owns this
            },
          },
          { upsert: true }
        );

        console.log(`  ✓ Seeded ${file} (${Array.isArray(data) ? data.length : 1} records)`);
        totalSeeded++;
      }
    }

    console.log(`\n✅ All data seeded successfully! (${totalSeeded} collections)`);
    console.log('\n📊 MongoDB Collections by Service:');
    
    for (const [service, files] of Object.entries(serviceDataMap)) {
      console.log(`  ${service}:`);
      files.forEach(f => console.log(`    - ${f}`));
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
