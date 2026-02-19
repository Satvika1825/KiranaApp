const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');

// POST /api/customer/address
router.post('/address', async (req, res) => {
  try {
    const { userId, houseNumber, street, landmark, pinCode, gpsLocation, label } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let customer = await Customer.findOne({ userId });
    if (!customer) {
      customer = new Customer({ userId, mobile: '', addresses: [] });
    }

    customer.addresses.push({ houseNumber, street, landmark, pinCode, gpsLocation, label });
    await customer.save();

    res.json({ message: 'Address added', addresses: customer.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer/addresses/:userId
router.get('/addresses/:userId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    res.json({ addresses: customer ? customer.addresses : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customer/address/:userId/:addressId
router.delete('/address/:userId/:addressId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.addresses = customer.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await customer.save();
    res.json({ message: 'Address removed', addresses: customer.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customer/profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, mobile, name, email } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let customer = await Customer.findOne({ userId });
    if (!customer) {
      customer = new Customer({ userId, mobile, name, email, addresses: [] });
    } else {
      if (name) customer.name = name;
      if (email) customer.email = email;
      if (mobile) customer.mobile = mobile;
    }
    await customer.save();

    res.json({ message: 'Profile saved', customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
