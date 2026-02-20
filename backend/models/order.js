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
    enum: ['New', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'],
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
  },

  // Denormalized shop info (for agent view)
  shopName: { type: String, default: '' },
  shopAddress: { type: String, default: '' },
  shopLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  // Customer drop location
  customerAddress: {
    text: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  // COD confirmation by agent
  codConfirmed: { type: Boolean, default: false },

  // Status timeline for customer tracking
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Delivery batch clustering
  deliveryBatchId: { type: String, default: null },

  // Delivery Fields
  deliveryAgentId: {
    type: String,
    default: null
  },
  deliveryAgentName: { type: String, default: '' },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  pickupTime: Date,
  deliveryTime: Date
});

module.exports = mongoose.model('Order', orderSchema);