const mongoose = require('mongoose');
require('dotenv').config();

const Store = require('./models/store');
const Product = require('./models/product');
const User = require('./models/user');
const Customer = require('./models/customer');

async function inspectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- Checking Stores ---');
        const stores = await Store.find({});
        console.log(`Found ${stores.length} stores.`);
        stores.forEach(s => {
            console.log(`Store ID: ${s._id}, Name: ${s.shopName}, Owner: ${s.ownerId}`);
            console.log('Address:', JSON.stringify(s.address, null, 2));
            if (!s.address || !s.address.houseNumber && !s.address.area) {
                console.warn('⚠️  Potential missing address details!');
            }
        });

        console.log('\n--- Checking Products ---');
        const products = await Product.find({}).limit(10); // Check first 10
        console.log(`Found ${products.length} products (showing first 10).`);
        products.forEach(p => {
            console.log(`Product: ${p.name}, Price: ${p.price}, ID: ${p.id}`);
        });

        console.log('\n--- Checking Customers ---');
        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers.`);
        customers.forEach(c => {
            console.log(`Customer: ${c.name}, Addresses: ${c.addresses.length}`);
            if (c.addresses.length > 0) {
                console.log('First Address:', JSON.stringify(c.addresses[0], null, 2));
            }
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

inspectDB();
