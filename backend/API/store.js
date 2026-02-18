const express = require('express');
const router = express.Router();
const Store = require('../models/store');
const authMiddleware = require('../middleware/auth');

// GET /api/stores/nearby?lat=17.3850&lng=78.4867
// Step 3: Discover nearby kirana stores
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km, default 5km
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const stores = await Store.find({
      gpsLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius * 1000, // convert km to meters
        },
      },
      isActive: true,
    }).select('name photo distance deliveryTime isOpen ratings address');

    // Add distance calculation if not using MongoDB geo
    res.json({ stores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stores/:storeId
// Get single store details
router.get('/:storeId', authMiddleware, async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
