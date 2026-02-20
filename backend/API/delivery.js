const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');
const Store = require('../models/store');

// ─── Haversine distance formula (returns km) ────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Parse gpsLocation string "lat,lng" or return {lat,lng} object ──────────
function parseLocation(loc) {
    if (!loc) return null;
    if (typeof loc === 'object' && loc.lat != null) return loc;
    if (typeof loc === 'string') {
        const parts = loc.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
    }
    return null;
}

// ─── Helper to find order by id or _id ──────────────────────────────────────
async function findOrder(orderId) {
    let order = await Order.findById(orderId).catch(() => null);
    if (!order) order = await Order.findOne({ id: orderId });
    return order;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/auto-assign
// Triggered when owner sets order status to "Ready for Pickup"
// Selects best available agent by: distance to shop → workload
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auto-assign', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'orderId required' });

        const order = await findOrder(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.deliveryAgentId) {
            return res.status(400).json({ error: 'Order already has an agent assigned' });
        }

        // Fetch shop info for pickup location
        const store = await Store.findOne({ ownerId: order.shopOwnerId });
        const shopLoc = store ? parseLocation(store.gpsLocation) : null;

        // Find all available agents
        const agents = await User.find({
            role: 'delivery_partner',
            agentStatus: { $in: ['available', 'busy'] }, // busy agents can take more if workload allows
            activeDeliveries: { $lt: 5 } // cap at 5 simultaneous deliveries
        });

        if (agents.length === 0) {
            return res.status(404).json({
                error: 'No delivery agents available right now. Please try again shortly.'
            });
        }

        // Score agents: lower is better
        // Score = distance_km * 2 + activeDeliveries * 1.5
        // If no coordinates available, fall back to workload only
        let bestAgent = null;
        let bestScore = Infinity;

        for (const agent of agents) {
            const agentLoc = agent.location && agent.location.lat !== 0
                ? agent.location
                : null;

            let distanceKm = 10; // default 10 km penalty if no location
            if (shopLoc && agentLoc) {
                distanceKm = haversineKm(agentLoc.lat, agentLoc.lng, shopLoc.lat, shopLoc.lng);
            }

            const score = distanceKm * 2 + agent.activeDeliveries * 1.5;
            if (score < bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }

        if (!bestAgent) {
            return res.status(404).json({ error: 'Could not find suitable agent' });
        }

        // ── Check for batch clustering (same area / same agent) ──────────────
        // If this agent already has orders in the same area, group them
        const existingBatch = await Order.findOne({
            deliveryAgentId: bestAgent._id.toString(),
            deliveryStatus: { $in: ['Assigned', 'Picked Up'] },
            deliveryBatchId: { $ne: null }
        });

        const batchId = existingBatch?.deliveryBatchId || `batch_${Date.now()}`;

        // ── Assign order ─────────────────────────────────────────────────────
        order.deliveryAgentId = bestAgent._id.toString();
        order.deliveryAgentName = bestAgent.name;
        order.deliveryStatus = 'Assigned';
        order.deliveryBatchId = batchId;
        order.status = 'Out for Delivery';

        // Populate shop info on order for agent view
        if (store) {
            order.shopName = store.shopName;
            order.shopAddress = [
                store.address?.houseNumber,
                store.address?.area,
                store.address?.landmark
            ].filter(Boolean).join(', ');
            if (shopLoc) {
                order.shopLocation = shopLoc;
            }
        }

        // Push to status history
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({ status: 'Assigned to Agent', timestamp: new Date() });

        await order.save();

        // Update agent counters
        await User.findByIdAndUpdate(bestAgent._id, {
            $inc: { activeDeliveries: 1 },
            agentStatus: 'busy'
        });

        res.json({
            message: 'Agent auto-assigned successfully',
            agent: {
                id: bestAgent._id.toString(),
                name: bestAgent.name,
                mobile: bestAgent.mobile,
                activeDeliveries: bestAgent.activeDeliveries + 1
            },
            batchId
        });
    } catch (err) {
        console.error('Auto-assign error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/delivery/agent-status
// Agent updates availability and/or their current location
// Body: { agentId, status: 'available'|'busy'|'offline', lat?, lng? }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/agent-status', async (req, res) => {
    try {
        const { agentId, status, lat, lng } = req.body;
        if (!agentId) return res.status(400).json({ error: 'agentId required' });

        const update = {};
        if (status) update.agentStatus = status;
        if (lat != null && lng != null) update.location = { lat, lng };

        const agent = await User.findByIdAndUpdate(agentId, { $set: update }, { new: true });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        res.json({
            message: 'Status updated',
            agent: {
                id: agent._id.toString(),
                name: agent.name,
                agentStatus: agent.agentStatus,
                location: agent.location,
                activeDeliveries: agent.activeDeliveries
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/orders
// Get orders assigned to the agent (active only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
    try {
        const { agentId } = req.query;
        if (!agentId) return res.status(400).json({ error: 'agentId is required' });

        const orders = await Order.find({
            deliveryAgentId: agentId,
            deliveryStatus: { $ne: 'Delivered' }
        }).sort({ createdAt: -1 });

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/history
// Completed deliveries for an agent
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
    try {
        const { agentId } = req.query;
        if (!agentId) return res.status(400).json({ error: 'agentId is required' });

        const orders = await Order.find({
            deliveryAgentId: agentId,
            deliveryStatus: 'Delivered'
        }).sort({ deliveryTime: -1 }).limit(30);

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/delivery/status
// Agent updates order delivery status
// Body: { orderId, status, agentId, codConfirmed? }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/status', async (req, res) => {
    try {
        const { orderId, status, agentId, codConfirmed } = req.body;
        if (!orderId || !status || !agentId) {
            return res.status(400).json({ error: 'orderId, status, and agentId are required' });
        }

        const order = await findOrder(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (String(order.deliveryAgentId) !== String(agentId)) {
            return res.status(403).json({ error: 'You are not assigned to this order' });
        }

        // COD guard — agent must confirm receipt before marking Delivered
        if (status === 'Delivered' && order.paymentMethod === 'cod' && !codConfirmed) {
            return res.status(400).json({
                error: 'COD_CONFIRMATION_REQUIRED',
                message: 'Please confirm you have collected the cash before completing this delivery.'
            });
        }

        if (status === 'Picked Up') {
            order.deliveryStatus = 'Picked Up';
            order.status = 'Out for Delivery';
            order.pickupTime = new Date();
        } else if (status === 'Out for Delivery') {
            order.deliveryStatus = 'Out for Delivery';
            order.status = 'Out for Delivery';
        } else if (status === 'Delivered') {
            order.deliveryStatus = 'Delivered';
            order.status = 'Delivered';
            order.deliveryTime = new Date();
            if (codConfirmed) order.codConfirmed = true;
        } else {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Push to status history
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({ status, timestamp: new Date() });
        await order.save();

        // If delivered, decrement agent workload
        if (status === 'Delivered') {
            const agent = await User.findById(agentId);
            if (agent) {
                const newCount = Math.max(0, agent.activeDeliveries - 1);
                await User.findByIdAndUpdate(agentId, {
                    $set: {
                        activeDeliveries: newCount,
                        agentStatus: newCount === 0 ? 'available' : 'busy'
                    }
                });
            }
        }

        res.json({ message: 'Order status updated', order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/delivery/assign  (Admin manual override)
// Body: { orderId, agentId }   — explicit agent assignment
// ─────────────────────────────────────────────────────────────────────────────
router.post('/assign', async (req, res) => {
    try {
        const { orderId, agentId } = req.body;

        let agent;
        if (agentId) {
            agent = await User.findById(agentId);
        } else {
            agent = await User.findOne({ role: 'delivery_partner' });
        }

        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const order = await findOrder(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // If previously assigned to different agent, fix their counter
        if (order.deliveryAgentId && order.deliveryAgentId !== agent._id.toString()) {
            await User.findByIdAndUpdate(order.deliveryAgentId, {
                $inc: { activeDeliveries: -1 }
            });
        }

        order.deliveryAgentId = agent._id.toString();
        order.deliveryAgentName = agent.name;
        order.deliveryStatus = 'Assigned';
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({ status: 'Manually Assigned', timestamp: new Date() });
        await order.save();

        await User.findByIdAndUpdate(agent._id, {
            $inc: { activeDeliveries: 1 },
            agentStatus: 'busy'
        });

        res.json({
            message: 'Agent assigned',
            agent: { id: agent._id.toString(), name: agent.name, mobile: agent.mobile }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/agents   (Admin: list all agents + their status)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agents', async (req, res) => {
    try {
        const agents = await User.find({ role: 'delivery_partner' }).select(
            'name mobile agentStatus activeDeliveries location'
        );
        res.json({ agents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
