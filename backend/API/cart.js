const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// GET /api/cart/:userId — Get cart for a user
router.get('/:userId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart/:userId — Update entire cart (replace items array)
router.post('/:userId', async (req, res) => {
  const { items } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
    }

    cart.items = items;
    cart.updatedAt = Date.now();

    const updatedCart = await cart.save();
    res.json(updatedCart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/cart/:userId/item — Add single item
router.post('/:userId/item', async (req, res) => {
  const { product, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.productId === product.id);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      if (quantity > 0) {
        cart.items.push({
          productId: product.id,
          quantity: quantity,
          name: product.name,
          price: product.price,
          shopOwnerId: product.shopOwnerId
        });
      }
    }

    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/:userId — Clear cart
router.delete('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
