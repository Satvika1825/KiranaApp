const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('Fetching current indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Check if id_1 index exists and is unique
    const idIndex = indexes.find(idx => idx.name === 'id_1');
    if (idIndex) {
      console.log('Found index "id_1". Dropping it...');
      await collection.dropIndex('id_1');
      console.log('Successfully dropped "id_1"');
    } else {
      console.log('Index "id_1" not found. Skipping drop.');
    }

    // Create new compound unique index
    console.log('Creating unique index on { id: 1, shopOwnerId: 1 }...');
    await collection.createIndex({ id: 1, shopOwnerId: 1 }, { unique: true });
    console.log('Successfully created compound unique index');

    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
