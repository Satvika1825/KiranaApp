const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    id: String,
    shopOwnerId: String,
    name: String,
    price: Number,
    available: Boolean,
    category: String
  },
  quantity: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    default: 'Guest'
  },
  shopOwnerId: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'],
    default: 'New'
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  specialInstructions: String,
  addressId: String,
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

module.exports = mongoose.model('Order', orderSchema);