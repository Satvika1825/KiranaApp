const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  shopOwnerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required']
  },
  price: {
    type: Number,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'General'
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index: same catalog product can exist for different owners
productSchema.index({ id: 1, shopOwnerId: 1 }, { unique: true });

// Index for faster searches
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);