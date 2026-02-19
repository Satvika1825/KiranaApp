const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: String,
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
    userId: {
        type: String,
        required: true,
        default: 'guest'
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Cart', cartSchema);
