const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  houseNumber: String,
  street: String,
  landmark: String,
  pinCode: String,
  gpsLocation: String,
  label: {
    type: String,
    enum: ['Home', 'Office', 'Other'],
    default: 'Home'
  }
});

const customerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  addresses: [addressSchema],
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  savedLists: [{
    name: String,
    productIds: [String],
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);