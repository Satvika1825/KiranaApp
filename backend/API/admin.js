const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Store = require('../models/store');
const Order = require('../models/order');
const jwt = require('jsonwebtoken');

// ─── Seed default admin on startup ────────────────────────────────────────────
(async () => {
    try {
        const existing = await User.findOne({ role: 'admin' });
        if (!existing) {
            await User.create({
                mobile: '0000000000',
                name: 'Admin',
                email: 'admin@kiranaapp.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            console.log('[Admin] Default admin seeded: admin@kiranaapp.com / admin123');
        }
    } catch (e) {
        console.error('[Admin] Seed error:', e.message);
    }
})();

// ─── POST /api/admin/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        if (user.password !== password) return res.status(401).json({ error: 'Invalid email or password' });
        if (!user.isActive) return res.status(403).json({ error: 'Admin account is disabled' });

        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');
        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [totalStores, totalCustomers, totalOwners, totalAgents, orders] = await Promise.all([
            Store.countDocuments({}),
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'kirana_owner' }),
            User.countDocuments({ role: 'delivery_partner' }),
            Order.find({}, 'totalPrice createdAt status').sort({ createdAt: -1 }).lean()
        ]);

        const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const totalOrders = orders.length;

        // Group orders by day of week for chart
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const revenueByDay = {};
        const ordersByDay = {};
        dayNames.forEach(d => { revenueByDay[d] = 0; ordersByDay[d] = 0; });

        orders.forEach(o => {
            const day = dayNames[new Date(o.createdAt).getDay()];
            revenueByDay[day] += o.totalPrice || 0;
            ordersByDay[day]++;
        });

        const revenueData = dayNames.map(day => ({ day, revenue: revenueByDay[day] }));
        const ordersData = dayNames.map(day => ({ day, orders: ordersByDay[day] }));

        res.json({
            totalStores,
            totalCustomers,
            totalOwners,
            totalAgents,
            totalOrders,
            totalRevenue,
            revenueData,
            ordersData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/admin/customers ──────────────────────────────────────────────────
router.get('/customers', async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' })
            .select('name mobile email isActive createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Fetch order counts per customer in bulk
        const customerIds = customers.map(c => c._id.toString());
        const orderCounts = await Order.aggregate([
            { $match: { customerId: { $in: customerIds } } },
            { $group: { _id: '$customerId', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        orderCounts.forEach(r => { countMap[r._id] = r.count; });

        const result = customers.map(c => ({
            ...c,
            id: c._id.toString(),
            totalOrders: countMap[c._id.toString()] || 0
        }));

        res.json({ customers: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/admin/customers/:userId/block ────────────────────────────────────
router.put('/customers/:userId/block', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'Customer not found' });

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `Customer ${user.isActive ? 'unblocked' : 'blocked'}`, isActive: user.isActive });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/admin/owners ─────────────────────────────────────────────────────
router.get('/owners', async (req, res) => {
    try {
        const owners = await User.find({ role: 'kirana_owner' })
            .select('name mobile email isActive createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Join shop names
        const ownerIds = owners.map(o => o._id.toString());
        const stores = await Store.find({ ownerId: { $in: ownerIds } })
            .select('ownerId shopName status')
            .lean();

        const storeMap = {};
        stores.forEach(s => { storeMap[s.ownerId] = s; });

        const result = owners.map(o => ({
            ...o,
            id: o._id.toString(),
            shopName: storeMap[o._id.toString()]?.shopName || '—',
            shopStatus: storeMap[o._id.toString()]?.status || 'active'
        }));

        res.json({ owners: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/admin/owners/:userId/suspend ─────────────────────────────────────
router.put('/owners/:userId/suspend', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'Owner not found' });

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `Owner ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/admin/stores ─────────────────────────────────────────────────────
router.get('/stores', async (req, res) => {
    try {
        const stores = await Store.find({})
            .sort({ createdAt: -1 })
            .lean();

        // Join owner names
        const ownerIds = stores.map(s => s.ownerId);
        const owners = await User.find({ _id: { $in: ownerIds } })
            .select('name mobile')
            .lean();

        const ownerMap = {};
        owners.forEach(o => { ownerMap[o._id.toString()] = o; });

        const result = stores.map(s => ({
            ...s,
            id: s._id.toString(),
            ownerName: ownerMap[s.ownerId]?.name || 'Unknown',
            ownerMobile: ownerMap[s.ownerId]?.mobile || ''
        }));

        res.json({ stores: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/admin/stores/:storeId/suspend ────────────────────────────────────
router.put('/stores/:storeId/suspend', async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        if (!store) return res.status(404).json({ error: 'Store not found' });

        store.status = store.status === 'active' ? 'suspended' : 'active';
        await store.save();

        res.json({ message: `Store ${store.status}`, status: store.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/admin/reports ────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
    try {
        const [orders, stores, totalCustomers] = await Promise.all([
            Order.find({}, 'totalPrice shopOwnerId shopName').lean(),
            Store.find({}, 'shopName ownerId status').lean(),
            User.countDocuments({ role: 'customer', isActive: true })
        ]);

        const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        const activeStores = stores.filter(s => s.status !== 'suspended').length;

        // Top stores by revenue
        const storeRevMap = {};
        const storeOrderMap = {};
        orders.forEach(o => {
            const key = o.shopOwnerId;
            storeRevMap[key] = (storeRevMap[key] || 0) + (o.totalPrice || 0);
            storeOrderMap[key] = (storeOrderMap[key] || 0) + 1;
        });

        // Map store names
        const storeNameMap = {};
        stores.forEach(s => { storeNameMap[s.ownerId] = s.shopName; });

        const topStores = Object.entries(storeRevMap)
            .map(([ownerId, revenue]) => ({
                name: storeNameMap[ownerId] || 'Unknown Store',
                revenue,
                orders: storeOrderMap[ownerId] || 0
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.json({
            totalRevenue,
            totalOrders,
            avgOrderValue,
            activeStores,
            activeCustomers: totalCustomers,
            topStores
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
