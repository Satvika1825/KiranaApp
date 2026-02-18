const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: String, // Keeping as String to match frontend ID generation for now, ideally ObjectId if products are in DB
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    name: String,
    price: Number,
    shopOwnerId: String
});

const cartSchema = new mongoose.Schema({
    // In a real app, this would be linked to a User ID. 
    // For now, we'll assume a single user or pass a deviceId/userId.
    userId: {
        type: String,
        required: true,
        default: 'guest' // Default for now
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Cart', cartSchema);
