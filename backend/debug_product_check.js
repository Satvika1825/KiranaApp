const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/product');

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        console.log(`\n--- Most Recent 5 Products ---`);
        if (products.length === 0) {
            console.log("No products found.");
        } else {
            products.forEach(p => {
                console.log(`\nID: ${p.id}`);
                console.log(`Name: ${p.name}`);
                console.log(`Price: ${p.price}`);
                console.log(`Owner: ${p.shopOwnerId}`);
                console.log(`Category: ${p.category}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

checkProducts();
