const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// POST /api/orders — Place an order
router.post('/', async (req, res) => {
  try {
    const { id, customerId, customerName, shopOwnerId, items, totalPrice, status, paymentMethod, specialInstructions, addressId, createdAt } = req.body;

    if (!id || !customerId || !shopOwnerId || !items || !totalPrice) {
      return res.status(400).json({ error: 'id, customerId, shopOwnerId, items, and totalPrice are required' });
    }

    const order = await Order.create({
      id,
      customerId,
      customerName: customerName || 'Guest',
      shopOwnerId,
      items,
      totalPrice,
      status: status || 'New',
      paymentMethod: paymentMethod || 'cod',
      specialInstructions: specialInstructions || '',
      addressId: addressId || '',
      createdAt: createdAt || new Date().toISOString()
    });

    res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/customer/:customerId — Get all orders of a customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/owner/:shopOwnerId — Get all orders for an owner
router.get('/owner/:shopOwnerId', async (req, res) => {
  try {
    const orders = await Order.find({ shopOwnerId: req.params.shopOwnerId })
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/detail/:orderId — Get single order detail
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:orderId/status — Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { id: req.params.orderId },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — Get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
