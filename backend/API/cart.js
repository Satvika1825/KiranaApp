const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

// GET /api/cart
// Step 5: View cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');
    if (!cart) return res.json({ items: [], itemTotal: 0, deliveryCharge: 0, finalAmount: 0 });

    const itemTotal = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );
    const deliveryCharge = itemTotal > 300 ? 0 : 30; // Free delivery above ₹300
    const finalAmount = itemTotal + deliveryCharge;

    res.json({ items: cart.items, itemTotal, deliveryCharge, finalAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/add
// Step 4: Add to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1, storeId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.isAvailable) return res.status(400).json({ error: 'Product not available' });

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, storeId, items: [] });
    }

    // Prevent mixing items from different stores
    if (cart.storeId && cart.storeId.toString() !== storeId) {
      return res.status(400).json({
        error: 'Cart has items from another store. Clear cart first.',
      });
    }

    const existingItem = cart.items.find((i) => i.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
      cart.storeId = storeId;
    }

    await cart.save();
    res.json({ message: 'Added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/update
// Step 5: Increase/decrease quantity
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/remove/:productId
// Step 5: Remove item
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.productId.toString() !== req.params.productId);
    if (cart.items.length === 0) cart.storeId = null;

    await cart.save();
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.userId });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
