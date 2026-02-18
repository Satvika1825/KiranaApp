const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  imageUrl: String,
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  items: [orderItemSchema],
  deliveryAddress: {
    flat: String,
    building: String,
    street: String,
    city: String,
    pincode: String,
    landmark: String,
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'UPI', 'Card', 'Wallet', 'Credit'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  subtotal: {
    type: Number,
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  deliverySlot: String,
  specialInstructions: String,
  estimatedDelivery: Date,
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ratings: {
    store: Number,
    delivery: Number,
    storeComment: String,
    deliveryComment: String
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);