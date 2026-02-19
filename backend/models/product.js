const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
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

// Index for faster searches
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);