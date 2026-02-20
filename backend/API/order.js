const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Store = require('../models/store');

// POST /api/orders — Place an order
router.post('/', async (req, res) => {
  try {
    const {
      id, customerId, customerName, shopOwnerId, items, totalPrice,
      status, paymentMethod, specialInstructions, addressId, createdAt,
      shopName, shopAddress, customerAddress
    } = req.body;

    if (!id || !customerId || !shopOwnerId || !items || !totalPrice) {
      return res.status(400).json({ error: 'id, customerId, shopOwnerId, items, and totalPrice are required' });
    }

    // Denormalize shop info
    let resolvedShopName = shopName || '';
    let resolvedShopAddress = shopAddress || '';
    let shopLocation = { lat: 0, lng: 0 };
    if (!resolvedShopName) {
      const store = await Store.findOne({ ownerId: shopOwnerId });
      if (store) {
        resolvedShopName = store.shopName;
        resolvedShopAddress = [store.address?.houseNumber, store.address?.area, store.address?.landmark].filter(Boolean).join(', ');
        if (store.gpsLocation) {
          const parts = typeof store.gpsLocation === 'string'
            ? store.gpsLocation.split(',').map(Number)
            : [store.gpsLocation.lat, store.gpsLocation.lng];
          if (parts.length === 2 && !isNaN(parts[0])) shopLocation = { lat: parts[0], lng: parts[1] };
        }
      }
    }

    const order = await Order.create({
      id, customerId, customerName: customerName || 'Guest', shopOwnerId,
      items, totalPrice, status: status || 'New',
      paymentMethod: paymentMethod || 'cod',
      specialInstructions: specialInstructions || '',
      addressId: addressId || '',
      createdAt: createdAt || new Date().toISOString(),
      shopName: resolvedShopName,
      shopAddress: resolvedShopAddress,
      shopLocation,
      customerAddress: customerAddress || { text: '', lat: 0, lng: 0 },
      statusHistory: [{ status: 'New', timestamp: new Date() }]
    });

    res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/customer/:customerId
router.get('/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/owner/:shopOwnerId
router.get('/owner/:shopOwnerId', async (req, res) => {
  try {
    const orders = await Order.find({ shopOwnerId: req.params.shopOwnerId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/detail/:orderId
router.get('/detail/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:orderId/status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const User = require('../models/user');

    let order = await Order.findOne({ id: req.params.orderId });
    if (!order) order = await Order.findById(req.params.orderId).catch(() => null);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status, timestamp: new Date() });

    // Auto-trigger delivery assignment when Ready for Pickup
    if (status === 'Ready for Pickup' && !order.deliveryAgentId) {
      try {
        const agents = await User.find({
          role: 'delivery_partner',
          agentStatus: { $in: ['available', 'busy'] },
          activeDeliveries: { $lt: 5 }
        });

        if (agents.length > 0) {
          // Sort by: activeDeliveries asc (least workload first)
          const best = agents.sort((a, b) => a.activeDeliveries - b.activeDeliveries)[0];
          order.deliveryAgentId = best._id.toString();
          order.deliveryAgentName = best.name;
          order.deliveryStatus = 'Assigned';
          order.deliveryBatchId = `batch_${Date.now()}`;
          order.statusHistory.push({ status: 'Assigned to Agent', timestamp: new Date() });

          await User.findByIdAndUpdate(best._id, {
            $inc: { activeDeliveries: 1 },
            agentStatus: 'busy'
          });
        }
      } catch (assignErr) {
        console.error('Auto-assign failed:', assignErr.message);
      }
    }

    await order.save();
    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — All orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
