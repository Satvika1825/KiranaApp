const express = require('express');
const router = express.Router();
const Store = require('../models/store');

// POST /api/stores — Create/update a store (shop setup)
router.post('/', async (req, res) => {
  try {
    const { ownerId, shopName, shopType, shopPhoto, address, gpsLocation, openingTime, closingTime, weeklyOff } = req.body;
    if (!ownerId || !shopName) {
      return res.status(400).json({ error: 'ownerId and shopName are required' });
    }

    let store = await Store.findOne({ ownerId });
    if (store) {
      // Update existing store
      store.shopName = shopName;
      store.shopType = shopType || store.shopType;
      store.shopPhoto = shopPhoto || store.shopPhoto;
      store.address = address || store.address;
      store.gpsLocation = gpsLocation || store.gpsLocation;
      store.openingTime = openingTime || store.openingTime;
      store.closingTime = closingTime || store.closingTime;
      store.weeklyOff = weeklyOff !== undefined ? weeklyOff : store.weeklyOff;
      await store.save();
    } else {
      store = await Store.create({
        ownerId, shopName, shopType, shopPhoto, address, gpsLocation, openingTime, closingTime, weeklyOff
      });
    }

    res.json({ message: 'Store saved', store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stores — List all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find({});
    res.json({ stores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stores/owner/:ownerId — Get store by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.params.ownerId });
    res.json({ store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stores/:storeId — Get single store by id
router.get('/:storeId', async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
