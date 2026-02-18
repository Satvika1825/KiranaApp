const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
app.use('/api/auth', require('./API/auth'));
app.use('/api/customer', require('./API/customer'));
app.use('/api/stores', require('./API/store'));
app.use('/api/products', require('./API/product'));
app.use('/api/cart', require('./API/cart'));
app.use('/api/orders', require('./API/order'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));