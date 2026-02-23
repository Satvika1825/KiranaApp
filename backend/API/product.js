const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const CatalogProduct = require('../models/catalogProduct');

// ────────────────────────────────────────────────────────────────
// CATALOG ENDPOINTS (must be before /:productId)
// ────────────────────────────────────────────────────────────────

// GET /api/products/catalog — return all master catalog products
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await CatalogProduct.find().sort({ category: 1, name: 1 });
    res.json({ catalog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/catalog/seed — seed catalog with default items (idempotent)
router.post('/catalog/seed', async (req, res) => {
  try {
    const items = [
      // Grains & Staples
      { id: 'cat-rice-001', name: 'Basmati Rice', category: 'Grains', defaultPrice: 120, unit: '1 kg' },
      { id: 'cat-rice-002', name: 'Sona Masoori Rice', category: 'Grains', defaultPrice: 80, unit: '1 kg' },
      { id: 'cat-wheat-001', name: 'Wheat Flour (Atta)', category: 'Grains', defaultPrice: 55, unit: '1 kg' },
      { id: 'cat-dal-001', name: 'Toor Dal', category: 'Grains', defaultPrice: 130, unit: '1 kg' },
      { id: 'cat-dal-002', name: 'Moong Dal', category: 'Grains', defaultPrice: 100, unit: '500 g' },
      { id: 'cat-dal-003', name: 'Chana Dal', category: 'Grains', defaultPrice: 90, unit: '1 kg' },
      { id: 'cat-sugar-001', name: 'Sugar', category: 'Grains', defaultPrice: 45, unit: '1 kg' },
      { id: 'cat-salt-001', name: 'Iodized Salt', category: 'Grains', defaultPrice: 20, unit: '1 kg' },
      // Dairy
      { id: 'cat-milk-001', name: 'Full Cream Milk', category: 'Dairy', defaultPrice: 28, unit: '500 ml' },
      { id: 'cat-curd-001', name: 'Fresh Curd', category: 'Dairy', defaultPrice: 30, unit: '200 g' },
      { id: 'cat-butter-001', name: 'Amul Butter', category: 'Dairy', defaultPrice: 55, unit: '100 g' },
      { id: 'cat-paneer-001', name: 'Paneer', category: 'Dairy', defaultPrice: 80, unit: '200 g' },
      // Beverages
      { id: 'cat-tea-001', name: 'Tata Tea', category: 'Beverages', defaultPrice: 70, unit: '250 g' },
      { id: 'cat-coffee-001', name: 'Nescafe Coffee', category: 'Beverages', defaultPrice: 90, unit: '50 g' },
      { id: 'cat-water-001', name: 'Bisleri Water', category: 'Beverages', defaultPrice: 20, unit: '1 L' },
      { id: 'cat-juice-001', name: 'Real Orange Juice', category: 'Beverages', defaultPrice: 85, unit: '1 L' },
      // Snacks
      { id: 'cat-biscuit-001', name: 'Parle-G Biscuits', category: 'Snacks', defaultPrice: 10, unit: '100 g' },
      { id: 'cat-chips-001', name: "Lays Chips", category: 'Snacks', defaultPrice: 20, unit: '26 g' },
      { id: 'cat-namkeen-001', name: 'Haldiram Namkeen', category: 'Snacks', defaultPrice: 50, unit: '200 g' },
      { id: 'cat-bread-001', name: 'Bread Loaf', category: 'Snacks', defaultPrice: 35, unit: '400 g' },
      // Oils & Spices
      { id: 'cat-oil-001', name: 'Sunflower Oil', category: 'Oils & Spices', defaultPrice: 130, unit: '1 L' },
      { id: 'cat-oil-002', name: 'Mustard Oil', category: 'Oils & Spices', defaultPrice: 140, unit: '1 L' },
      { id: 'cat-chilli-001', name: 'Red Chilli Powder', category: 'Oils & Spices', defaultPrice: 60, unit: '100 g' },
      { id: 'cat-turmeric-001', name: 'Turmeric Powder', category: 'Oils & Spices', defaultPrice: 40, unit: '100 g' },
      { id: 'cat-garam-001', name: 'Garam Masala', category: 'Oils & Spices', defaultPrice: 55, unit: '100 g' },
      // Cleaning
      { id: 'cat-soap-001', name: 'Lifebuoy Soap', category: 'Cleaning', defaultPrice: 35, unit: '100 g' },
      { id: 'cat-detergent-001', name: 'Ariel Powder', category: 'Cleaning', defaultPrice: 120, unit: '500 g' },
      { id: 'cat-dishwash-001', name: 'Vim Bar', category: 'Cleaning', defaultPrice: 25, unit: '200 g' },
      // Personal Care
      { id: 'cat-shampoo-001', name: 'Head & Shoulders', category: 'Personal Care', defaultPrice: 90, unit: '180 ml' },
      { id: 'cat-toothpaste-001', name: 'Colgate Toothpaste', category: 'Personal Care', defaultPrice: 50, unit: '100 g' },
    ];

    let seeded = 0;
    for (const item of items) {
      await CatalogProduct.findOneAndUpdate(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true }
      );
      seeded++;
    }
    res.json({ message: `Catalog seeded with ${seeded} items` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/toggle — add or remove a catalog product for an owner
router.post('/toggle', async (req, res) => {
  try {
    const { catalogProductId, ownerId, enabled, price } = req.body;
    if (!catalogProductId || !ownerId) {
      return res.status(400).json({ error: 'catalogProductId and ownerId are required' });
    }

    if (enabled) {
      // Fetch the catalog item to get name/category/defaultPrice
      const catalog = await CatalogProduct.findOne({ id: catalogProductId });
      if (!catalog) return res.status(404).json({ error: 'Catalog product not found' });

      // Upsert this product for the owner
      const product = await Product.findOneAndUpdate(
        { id: catalogProductId, shopOwnerId: ownerId },
        {
          $set: {
            id: catalogProductId,
            shopOwnerId: ownerId,
            name: catalog.name,
            category: catalog.category,
            price: price || catalog.defaultPrice,
            available: true,
            image: catalog.image || '',
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
      res.json({ message: 'Product added to store', product });
    } else {
      // Remove the product from this owner's store
      await Product.findOneAndDelete({ id: catalogProductId, shopOwnerId: ownerId });
      res.json({ message: 'Product removed from store' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// STANDARD PRODUCT ENDPOINTS
// ────────────────────────────────────────────────────────────────

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

// GET /api/products/:productId?shopOwnerId=xxx
router.get('/:productId', async (req, res) => {
  try {
    const { shopOwnerId } = req.query;
    const filter = { id: req.params.productId };
    if (shopOwnerId) filter.shopOwnerId = shopOwnerId;
    const product = await Product.findOne(filter);
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

// PUT /api/products/:productId?shopOwnerId=xxx — Update a product
router.put('/:productId', async (req, res) => {
  try {
    const { shopOwnerId } = req.query;
    const updates = req.body;
    if (!shopOwnerId) {
      return res.status(400).json({ error: 'shopOwnerId query parameter is required' });
    }
    const product = await Product.findOneAndUpdate(
      { id: req.params.productId, shopOwnerId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:productId?shopOwnerId=xxx — Delete a product
router.delete('/:productId', async (req, res) => {
  try {
    const { shopOwnerId } = req.query;
    if (!shopOwnerId) {
      return res.status(400).json({ error: 'shopOwnerId query parameter is required' });
    }
    const product = await Product.findOneAndDelete({ id: req.params.productId, shopOwnerId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk — Bulk save products (expects id, shopOwnerId in each product)
router.post('/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'products array is required' });
    }
    const results = [];
    for (const p of products) {
      if (!p.id || !p.shopOwnerId) {
        return res.status(400).json({ error: 'Each product must have id and shopOwnerId' });
      }
      const result = await Product.findOneAndUpdate(
        { id: p.id, shopOwnerId: p.shopOwnerId },
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
