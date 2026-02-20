const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products?shopOwnerId=xxx&category=Rice&search=milk
router.get('/', async (req, res) => {
  try {
    const { shopOwnerId, category, search } = req.query;

    const filter = {};
    if (shopOwnerId) filter.shopOwnerId = shopOwnerId;

    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories?shopOwnerId=xxx
router.get('/categories', async (req, res) => {
  try {
    const { shopOwnerId } = req.query;
    const filter = {};
    if (shopOwnerId) filter.shopOwnerId = shopOwnerId;
    const categories = await Product.distinct('category', filter);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:productId
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — Add a product
router.post('/', async (req, res) => {
  try {
    const { id, shopOwnerId, name, price, available, category, image } = req.body;
    if (!id || !shopOwnerId || !name || price === undefined) {
      return res.status(400).json({ error: 'id, shopOwnerId, name, and price are required' });
    }

    const product = await Product.create({
      id, shopOwnerId, name, price,
      available: available !== undefined ? available : true,
      category: category || 'General',
      image: image || ''
    });

    res.status(201).json({ message: 'Product added', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:productId — Update a product
router.put('/:productId', async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findOneAndUpdate(
      { id: req.params.productId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:productId — Delete a product
router.delete('/:productId', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk — Bulk save products (for seeding)
router.post('/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'products array is required' });
    }

    // Upsert each product
    const results = [];
    for (const p of products) {
      const result = await Product.findOneAndUpdate(
        { id: p.id },
        { $set: p },
        { upsert: true, returnDocument: 'after' }
      );
      results.push(result);
    }

    res.json({ message: `${results.length} products saved`, products: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
