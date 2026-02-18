const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter valid 10-digit phone number']
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['customer', 'kirana_owner', 'delivery_partner', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// Hash OTP before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) {
    next();
  }
  if (this.otp) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
});

// Compare OTP
userSchema.methods.compareOTP = async function(enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

module.exports = mongoose.model('User', userSchema);