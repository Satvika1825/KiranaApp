const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Get cart for a user
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

// Update cart (add/remove/update quantity)
router.post('/:userId', async (req, res) => {
    const { items } = req.body; // Expecting full array of items or single item action

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

// Add single item (optional, if needed for optimization)
router.post('/:userId/item', async (req, res) => {
    const { product, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(p => p.productId === product.id);

        if (itemIndex > -1) {
            // product exists in the cart, update the quantity
            cart.items[itemIndex].quantity += quantity;
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        } else {
            // product does not exist in cart, add new item
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

// Clear cart
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
