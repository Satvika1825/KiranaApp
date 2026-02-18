const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

// GET /api/products?storeId=xxx&category=Rice&search=milk
// Step 4: Browse & Search Products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { storeId, category, search } = req.query;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });

    const filter = { storeId, isAvailable: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).select(
      'name image price quantity category isAvailable'
    );

    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories?storeId=xxx
// Get all categories for a store
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { storeId } = req.query;
    const categories = await Product.distinct('category', { storeId });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:productId
router.get('/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
