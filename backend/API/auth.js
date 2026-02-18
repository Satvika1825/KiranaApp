const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Customer = require('../models/customer');

// In-memory OTP store (use Redis in production)
const otpStore = {};

// POST /api/auth/send-otp
// Step 1: Customer enters mobile number
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    // TODO: Send OTP via SMS (Twilio/MSG91/etc.)
    console.log(`OTP for ${mobile}: ${otp}`); // Remove in production

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp
// Step 1: Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, name, email } = req.body;

    const record = otpStore[mobile];
    if (!record) return res.status(400).json({ error: 'OTP not sent or expired' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });

    delete otpStore[mobile];

    // Find or create user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile, name, email, role: 'customer' });
      await Customer.create({ userId: user._id, mobile });
    } else {
      // Update optional fields if provided
      if (name) user.name = name;
      if (email) user.email = email;
      await user.save();
    }

    // Generate token (JWT)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
