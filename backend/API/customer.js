const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Fuse = require('fuse.js');
const Customer = require('../models/customer');
const Product = require('../models/product');

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });


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

// POST /api/customer/saved-list
router.post('/saved-list', async (req, res) => {
  try {
    const { userId, name, productIds } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let customer = await Customer.findOne({ userId });
    if (!customer) {
      customer = new Customer({ userId, mobile: '', addresses: [], savedLists: [] });
    }

    customer.savedLists.push({ name, productIds });
    await customer.save();

    res.json({ message: 'Saved list added', savedLists: customer.savedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer/saved-lists/:userId
router.get('/saved-lists/:userId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    res.json({ savedLists: customer ? customer.savedLists : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customer/saved-list/:userId/:listId
router.delete('/saved-list/:userId/:listId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.savedLists = customer.savedLists.filter(
      (l) => l._id.toString() !== req.params.listId
    );
    await customer.save();
    res.json({ message: 'Saved list removed', savedLists: customer.savedLists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customer/upload-list
// Uploads an image of a grocery list and matches items with store inventory
router.post('/upload-list', upload.single('listImage'), async (req, res) => {
  try {
    const { ownerId } = req.body;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    // 1. Fetch store inventory
    const inventory = await Product.find({ shopOwnerId: ownerId, available: true });
    if (inventory.length === 0) {
      return res.status(400).json({ error: 'Store has no available products' });
    }

    // 2. Process image with Tesseract
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      { logger: m => console.log(m) }
    );

    if (!text) {
      return res.status(500).json({ error: 'Failed to extract text from image' });
    }

    // Split text into lines and clean up
    const extractedItems = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2); // Filter out noise

    // 3. Fuzzy match with inventory
    const fuse = new Fuse(inventory, {
      keys: ['name'],
      threshold: 0.4, // Adjust for sensitivity
      includeScore: true
    });

    const results = extractedItems.map(item => {
      const matches = fuse.search(item);
      if (matches.length > 0) {
        // Return top match and suggestions
        return {
          original: item,
          matched: {
            id: matches[0].item.id,
            name: matches[0].item.name,
            price: matches[0].item.price,
            category: matches[0].item.category,
            image: matches[0].item.image
          },
          suggestions: matches.slice(1, 4).map(m => ({
            id: m.item.id,
            name: m.item.name,
            price: m.item.price
          })),
          status: 'matched'
        };
      } else {
        return {
          original: item,
          matched: null,
          suggestions: [],
          status: 'not_available'
        };
      }
    });

    res.json({ results });
  } catch (err) {
    console.error('OCR Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

