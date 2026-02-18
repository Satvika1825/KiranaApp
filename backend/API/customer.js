const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const authMiddleware = require('../middleware/auth');

// POST /api/customer/address
// Step 2: Add delivery address
router.post('/address', authMiddleware, async (req, res) => {
  try {
    const { houseNumber, street, landmark, pinCode, gpsLocation, label } = req.body;
    // label: 'Home' | 'Office' | 'Other'

    const customer = await Customer.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.addresses.push({ houseNumber, street, landmark, pinCode, gpsLocation, label });
    await customer.save();

    res.json({ message: 'Address added', addresses: customer.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer/addresses
// Get all saved addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.userId });
    res.json({ addresses: customer.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customer/address/:addressId
router.delete('/address/:addressId', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.userId });
    customer.addresses = customer.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await customer.save();
    res.json({ message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user.userId }).populate('userId');
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
