const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/Cart');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

// POST /api/orders/place
// Step 6 & 7: Place order with payment method
router.post('/place', authMiddleware, async (req, res) => {
  try {
    const { addressId, paymentMethod, specialInstructions } = req.body;
    // paymentMethod: 'UPI' | 'COD' | 'PAY_LATER'

    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: 'Cart is empty' });

    // Build order items
    const orderItems = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity,
    }));

    const itemTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryCharge = itemTotal > 300 ? 0 : 30;
    const finalAmount = itemTotal + deliveryCharge;

    const order = await Order.create({
      userId: req.user.userId,
      storeId: cart.storeId,
      items: orderItems,
      addressId,
      paymentMethod,
      specialInstructions,
      itemTotal,
      deliveryCharge,
      finalAmount,
      status: 'PENDING', // PENDING → ACCEPTED → PACKED → OUT_FOR_DELIVERY → DELIVERED
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    });

    // Clear cart after placing order
    await Cart.findOneAndDelete({ userId: req.user.userId });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders
// Get all orders of customer
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('storeId', 'name');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:orderId
// Step 7: Track order status
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId,
    }).populate('storeId', 'name photo');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:orderId/confirm-delivery
// Step 8: Customer confirms delivery (for COD payment)
router.put('/:orderId/confirm-delivery', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.userId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'OUT_FOR_DELIVERY')
      return res.status(400).json({ error: 'Order not yet out for delivery' });

    order.status = 'DELIVERED';
    if (order.paymentMethod === 'COD') order.paymentStatus = 'PAID';
    order.deliveredAt = new Date();
    await order.save();

    res.json({ message: 'Delivery confirmed', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:orderId/rate
// Step 9: Rating & Feedback
router.post('/:orderId/rate', authMiddleware, async (req, res) => {
  try {
    const { storeRating, deliveryRating, feedback } = req.body;

    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.userId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'DELIVERED')
      return res.status(400).json({ error: 'Can only rate delivered orders' });

    order.rating = { storeRating, deliveryRating, feedback };
    await order.save();

    // Optionally update store's average rating
    const Store = require('../models/store');
    const allRatings = await Order.find({ storeId: order.storeId, 'rating.storeRating': { $exists: true } });
    const avgRating =
      allRatings.reduce((sum, o) => sum + o.rating.storeRating, 0) / allRatings.length;
    await Store.findByIdAndUpdate(order.storeId, { rating: avgRating.toFixed(1) });

    res.json({ message: 'Rating submitted', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/reorder/:orderId
// Step 10: Reorder past purchase in 1 click
router.post('/reorder/:orderId', authMiddleware, async (req, res) => {
  try {
    const pastOrder = await Order.findOne({ _id: req.params.orderId, userId: req.user.userId });
    if (!pastOrder) return res.status(404).json({ error: 'Order not found' });

    // Rebuild cart from past order
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, storeId: pastOrder.storeId, items: [] });
    }

    for (const item of pastOrder.items) {
      const product = await Product.findById(item.productId);
      if (product && product.isAvailable) {
        const existing = cart.items.find((i) => i.productId.toString() === item.productId.toString());
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          cart.items.push({ productId: item.productId, quantity: item.quantity });
        }
      }
    }

    await cart.save();
    res.json({ message: 'Items added to cart for reorder', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
