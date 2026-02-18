const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Store name is required']
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    open: {
      type: String,
      default: '08:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
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
  freeDeliveryAbove: {
    type: Number,
    default: 200
  },
  photoUrl: String,
  categories: [String],
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiresAt: Date
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);