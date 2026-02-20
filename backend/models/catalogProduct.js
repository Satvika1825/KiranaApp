const mongoose = require('mongoose');

const catalogProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    defaultPrice: { type: Number, required: true },
    image: { type: String, default: '' },
    unit: { type: String, default: '' }, // e.g. "1kg", "500ml"
}, { timestamps: true });

module.exports = mongoose.model('CatalogProduct', catalogProductSchema);
