/**
 * Drop old single-column unique index on Products.id
 * and replace with compound unique index on (id, shopOwnerId)
 */
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiranaconnect');
    console.log('MongoDB connected');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixIndex = async () => {
  try {
    const db = await connectDB();
    const productCollection = db.connection.collection('products');

    // Get all existing indexes
    const indexes = await productCollection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop the old single-column unique index if it exists
    if (indexes.id_1) {
      await productCollection.dropIndex('id_1');
      console.log('✓ Dropped old unique index on id');
    }

    // Ensure new compound unique index exists
    await productCollection.createIndex({ id: 1, shopOwnerId: 1 }, { unique: true });
    console.log('✓ Created compound unique index on (id, shopOwnerId)');

    const updatedIndexes = await productCollection.getIndexes();
    console.log('Updated indexes:', Object.keys(updatedIndexes));

    console.log('\n✓ Index migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
};

fixIndex();
