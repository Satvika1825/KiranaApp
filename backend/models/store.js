const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required']
  },
  shopType: {
    type: String,
    default: 'Kirana'
  },
  shopPhoto: {
    type: String,
    default: ''
  },
  address: {
    houseNumber: String,
    area: String,
    landmark: String,
    pinCode: String
  },
  gpsLocation: {
    type: String,
    default: ''
  },
  phone: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openingTime: {
    type: String,
    default: '07:00'
  },
  closingTime: {
    type: String,
    default: '21:00'
  },
  weeklyOff: {
    type: String,
    default: ''
  },
  deliveryTime: {
    type: String,
    default: '30-45 mins'
  },
  minimumOrder: {
    type: Number,
    default: 100
  },
  deliveryCharge: {
    type: Number,
    default: 20
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Store', storeSchema);