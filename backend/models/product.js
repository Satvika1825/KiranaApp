const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required']
  },
  brand: String,
  category: {
    type: String,
    required: true
  },
  description: String,
  imageUrl: String,
  barcode: String,
  mrp: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  unit: String,  // '5 kg', '1 liter', etc.
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
productSchema.index({ name: 'text', brand: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);