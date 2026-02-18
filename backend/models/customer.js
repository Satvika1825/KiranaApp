const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    default: 'Home'
  },
  flat: String,
  building: String,
  street: String,
  city: String,
  pincode: String,
  landmark: String,
  latitude: Number,
  longitude: Number,
  isDefault: {
    type: Boolean,
    default: false
  }
});

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Please enter valid email']
  },
  photoUrl: String,
  addresses: [addressSchema],
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);