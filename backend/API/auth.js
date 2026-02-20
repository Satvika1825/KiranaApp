const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Customer = require('../models/customer');
const jwt = require('jsonwebtoken');

const otpStore = {};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Middleware to log all auth requests
router.use((req, res, next) => {
  console.log(`[AUTH] ${req.method} ${req.path}`, JSON.stringify(req.body));
  next();
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    let { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

    mobile = mobile.replace(/\D/g, ''); // ✅ sanitize before storing
    if (mobile.length < 10 || mobile.length > 15) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    console.log(`OTP for ${mobile}: ${otp}`);
    res.json({ message: 'OTP sent successfully', otp });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    let { mobile, otp, name, email, role, password } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });
    if (!otp) return res.status(400).json({ error: 'OTP required' });

    mobile = mobile.replace(/\D/g, '');

    // Validate mobile after sanitization
    if (mobile.length < 10 || mobile.length > 15) {
      return res.status(400).json({ error: 'Invalid mobile format' });
    }

    console.log('verify-otp → mobile:', mobile, '| otp:', otp, '| role:', role);

    const record = otpStore[mobile];
    console.log('OTP record found:', record);

    if (!record) {
      console.log('OTP Verification Failed: No record found for', mobile);
      return res.status(400).json({ error: 'OTP not sent or expired (no record found)' });
    }
    if (record.otp !== otp) {
      console.log(`OTP Verification Failed: Invalid OTP. Expected ${record.otp}, Got ${otp}`);
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    if (Date.now() > record.expiresAt) {
      console.log('OTP Verification Failed: Expired');
      return res.status(400).json({ error: 'OTP expired' });
    }

    delete otpStore[mobile];

    // Find or create User
    let user = await User.findOne({ mobile });
    console.log('Existing user found:', user ? user._id : 'none');

    if (!user) {
      user = await User.create({
        mobile,
        name: name || '',
        email: email || '',
        password: password || '',
        role: role || 'customer',
        isActive: true
      });
      console.log('New user created:', user._id);
    } else {
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = password;  // update password if provided
      if (role && role !== user.role) user.role = role;
      user.isActive = true;
      await user.save();
      console.log('User updated:', user._id);
    }

    // Find or create Customer (only for customer role)
    if (user.role === 'customer') {
      try {
        let customer = await Customer.findOne({ userId: user._id.toString() });
        if (!customer) {
          customer = await Customer.create({
            userId: user._id.toString(),
            mobile: user.mobile,
            name: user.name || '',
            email: user.email || ''
          });
          console.log('New customer created:', customer._id);
        }
      } catch (customerErr) {
        console.error('Customer creation error:', customerErr.message);
        // Don't fail the verify-otp request due to Customer creation issues
      }
    }

    const token = generateToken(user);
    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: err.message || 'Verification failed',
      details: err.toString()
    });
  }
});

// POST /api/auth/register-owner
router.post('/register-owner', async (req, res) => {
  try {
    let { fullName, mobile, email, password } = req.body;
    console.log('register-owner body:', req.body);

    if (!mobile || !fullName) {
      return res.status(400).json({ error: 'Name and mobile required' });
    }

    mobile = mobile.replace(/\D/g, '');
    if (mobile.length < 10 || mobile.length > 15) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({
        mobile,
        name: fullName,
        email: email || '',
        password: password || '',
        role: 'kirana_owner'
      });
    } else {
      user.name = fullName;
      user.email = email || user.email;
      user.password = password || user.password;
      user.role = 'kirana_owner';
      await user.save();
    }

    const token = generateToken(user);
    res.status(201).json({
      message: 'Owner registered successfully',
      token,
      user: {
        id: user._id.toString(),
        fullName: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register Owner Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login-owner
router.post('/login-owner', async (req, res) => {
  try {
    let { mobile, password } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });
    if (!password) return res.status(400).json({ error: 'Password required' });

    mobile = mobile.replace(/\D/g, '');
    if (mobile.length < 10 || mobile.length > 15) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const user = await User.findOne({ mobile, role: 'kirana_owner' });
    if (!user) {
      return res.status(404).json({ error: 'Owner not found. Please register first.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        fullName: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Owner Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;