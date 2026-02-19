const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS with explicit origin
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = ["http://localhost:8080", "http://localhost:5173", "http://localhost:8081", "http://127.0.0.1:8081", "http://127.0.0.1:5000"];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("Origin blocked by CORS:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

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