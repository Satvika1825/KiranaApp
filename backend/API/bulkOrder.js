const express = require("express");
const router = express.Router();
const Apartment = require("../models/apartment");
const BulkOrderWindow = require("../models/bulkOrderWindow");
const BulkOrder = require("../models/bulkOrder");
const Customer = require("../models/customer");
const Order = require("../models/order");

// ========== CUSTOMER ENDPOINTS ==========

// Get all active apartments with bulk order windows
router.get("/apartments", async (req, res) => {
  try {
    const apartments = await Apartment.find({ isActive: true })
      .select("name address area city registeredFamilies totalFamilies deliveryRadius")
      .lean();

    // Add current active window info
    const today = new Date();
    const currentDay = today.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = today.getHours().toString().padStart(2, "0") + ":" + today.getMinutes().toString().padStart(2, "0");

    const enrichedApartments = await Promise.all(
      apartments.map(async (apt) => {
        const activeWindow = await BulkOrderWindow.findOne({
          apartment: apt._id,
          daysOfWeek: currentDay,
          isActive: true,
        }).lean();

        const timeInRange = activeWindow
          ? currentTime >= activeWindow.startTime && currentTime <= activeWindow.endTime
          : false;

        return {
          ...apt,
          activeWindow,
          isOrderingOpen: timeInRange,
        };
      })
    );

    res.json(enrichedApartments);
  } catch (err) {
    console.error("Error fetching apartments:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get specific apartment details with current order window
router.get("/apartments/:apartmentId", async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.apartmentId);
    if (!apartment) return res.status(404).json({ error: "Apartment not found" });

    const today = new Date();
    const currentDay = today.toLocaleDateString("en-US", { weekday: "long" });

    const activeWindow = await BulkOrderWindow.findOne({
      apartment: apartment._id,
      daysOfWeek: currentDay,
      isActive: true,
    });

    const currentBulkOrder = await BulkOrder.findOne({
      apartment: apartment._id,
      status: { $in: ["PENDING", "CONFIRMED"] },
    }).lean();

    res.json({
      apartment,
      activeWindow,
      currentBulkOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer apartment profile
router.post("/customer/apartment", async (req, res) => {
  try {
    const { customerId, apartmentId, apartmentUnit } = req.body;

    // Find customer by userId (stored in localStorage) or by _id
    const updatedCustomer = await Customer.findOneAndUpdate(
      { $or: [{ _id: customerId }, { userId: customerId }] },
      {
        apartment: apartmentId,
        apartmentUnit,
        enrolledInBulkOrdering: true,
      },
      { new: true }
    ).populate('apartment');

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    console.log('Updated customer apartment:', updatedCustomer);
    res.json(updatedCustomer);
  } catch (err) {
    console.error('Error updating customer apartment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Join a bulk order (customer places order during bulk window)
router.post("/bulk-orders/join", async (req, res) => {
  try {
    const { customerId, apartmentId, orderId, items, totalAmount, shopId } = req.body;

    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ error: "Apartment not found" });

    const today = new Date();
    const currentDay = today.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = today.getHours().toString().padStart(2, "0") + ":" + today.getMinutes().toString().padStart(2, "0");

    const activeWindow = await BulkOrderWindow.findOne({
      apartment: apartmentId,
      daysOfWeek: currentDay,
      isActive: true,
    });

    if (!activeWindow) {
      return res.status(400).json({ error: "No active bulk ordering window right now" });
    }

    if (currentTime < activeWindow.startTime || currentTime > activeWindow.endTime) {
      return res.status(400).json({ error: "Outside bulk ordering time window" });
    }

    // Find or create bulk order for this apartment today
    const today_str = today.toISOString().split("T")[0];
    const bulkOrderId = `BULK-APT-${apartment._id.toString().slice(-6)}-${today_str.replace(/-/g, "")}`;

    let bulkOrder = await BulkOrder.findOne({
      bulkOrderId,
    });

    if (!bulkOrder) {
      bulkOrder = new BulkOrder({
        bulkOrderId,
        apartment: apartmentId,
        orderWindow: activeWindow._id,
        participatingCustomers: [],
        status: "PENDING",
        totalItems: 0,
        totalFamilies: 0,
        totalAmount: 0,
        deliveryFeeDiscount: 15, // ₹15 flat discount for bulk orders
        estimatedDeliveryDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // next day
      });
    }

    // Add customer's order to bulk
    bulkOrder.participatingCustomers.push({
      customer: customerId,
      order: orderId,
      items,
      totalAmount,
      shop: shopId,
    });

    bulkOrder.totalFamilies = bulkOrder.participatingCustomers.length;
    bulkOrder.totalAmount += totalAmount;
    bulkOrder.totalItems += items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Calculate total items
    const allItems = bulkOrder.participatingCustomers.reduce((sum, pc) => sum + (pc.items?.length || 0), 0);
    bulkOrder.totalItems = allItems;

    await bulkOrder.save();

    res.json({
      success: true,
      bulkOrder,
      message: `Joined bulk order. ${bulkOrder.totalFamilies} families are ordering together!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current bulk order for customer's apartment
router.get("/current/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId).populate("apartment");
    if (!customer || !customer.apartment) {
      return res.json({ bulkOrder: null, message: "Customer apartment not configured" });
    }

    const today = new Date();
    const today_str = today.toISOString().split("T")[0];

    const bulkOrder = await BulkOrder.findOne({
      apartment: customer.apartment._id,
      status: { $in: ["PENDING", "CONFIRMED"] },
    }).populate("apartment", "name");

    if (!bulkOrder) {
      return res.json({ bulkOrder: null });
    }

    // Calculate time remaining
    const activeWindow = await BulkOrderWindow.findById(bulkOrder.orderWindow);
    const today_obj = new Date();
    const [startHour, startMin] = activeWindow.startTime.split(":").map(Number);
    const [endHour, endMin] = activeWindow.endTime.split(":").map(Number);

    const windowStart = new Date(today_obj);
    windowStart.setHours(startHour, startMin, 0);

    const windowEnd = new Date(today_obj);
    windowEnd.setHours(endHour, endMin, 0);

    const timeRemaining = windowEnd.getTime() - today_obj.getTime();
    const minutesRemaining = Math.max(0, Math.floor(timeRemaining / 60000));

    res.json({
      bulkOrder,
      timeRemaining: minutesRemaining,
      windowStart: activeWindow.startTime,
      windowEnd: activeWindow.endTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SHOPKEEPER ENDPOINTS ==========

// Get bulk orders for shopkeeper
router.get("/shopkeeper/bulk-orders/:shopId", async (req, res) => {
  try {
    const bulkOrders = await BulkOrder.find({
      "participatingCustomers.shop": req.params.shopId,
      status: { $in: ["CONFIRMED", "PREPARING", "READY"] },
    })
      .populate("apartment", "name address")
      .populate("participatingCustomers.customer", "name mobile")
      .sort({ createdAt: -1 });

    res.json(bulkOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update bulk order preparation status
router.patch("/bulk-orders/:bulkOrderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.bulkOrderId,
      { status },
      { new: true }
    );

    res.json(bulkOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== DELIVERY AGENT ENDPOINTS ==========

// Get bulk deliveries for delivery agent
router.get("/delivery-agent/bulk-deliveries/:agentId", async (req, res) => {
  try {
    const bulkOrders = await BulkOrder.find({
      deliveryAgent: req.params.agentId,
      status: { $in: ["READY", "OUT_FOR_DELIVERY"] },
    })
      .populate("apartment", "name address area")
      .populate("participatingCustomers.customer", "name mobile apartmentUnit")
      .sort({ createdAt: -1 });

    res.json(bulkOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign delivery agent to bulk order
router.patch("/bulk-orders/:bulkOrderId/assign-agent", async (req, res) => {
  try {
    const { agentId } = req.body;
    const bulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.bulkOrderId,
      {
        deliveryAgent: agentId,
        status: "OUT_FOR_DELIVERY",
        deliverySlot: {
          startTime: new Date().toTimeString().split(" ")[0],
          endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().split(" ")[0],
        },
      },
      { new: true }
    );

    res.json(bulkOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark bulk order as delivered
router.patch("/bulk-orders/:bulkOrderId/delivered", async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.bulkOrderId,
      {
        status: "DELIVERED",
        actualDeliveryDate: new Date(),
      },
      { new: true }
    );

    res.json(bulkOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN ENDPOINTS ==========

// Create/Update bulk order time window
router.post("/admin/order-windows", async (req, res) => {
  try {
    const { name, startTime, endTime, daysOfWeek, apartmentId } = req.body;

    const window = new BulkOrderWindow({
      name,
      startTime,
      endTime,
      daysOfWeek,
      apartment: apartmentId,
      isActive: true,
    });

    await window.save();
    res.json(window);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create apartment
router.post("/admin/apartments", async (req, res) => {
  try {
    const { name, address, area, city, postalCode, latitude, longitude, totalFamilies, deliveryRadius } = req.body;

    const apartment = new Apartment({
      name,
      address,
      area,
      city,
      postalCode,
      latitude,
      longitude,
      totalFamilies,
      deliveryRadius,
      isActive: true,
    });

    await apartment.save();
    res.json(apartment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all apartments (admin)
router.get("/admin/apartments", async (req, res) => {
  try {
    const apartments = await Apartment.find().sort({ createdAt: -1 });
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update apartment
router.patch("/admin/apartments/:apartmentId", async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(
      req.params.apartmentId,
      req.body,
      { new: true }
    );

    res.json(apartment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bulk order statistics
router.get("/admin/statistics", async (req, res) => {
  try {
    const totalBulkOrders = await BulkOrder.countDocuments();
    const totalApartments = await Apartment.countDocuments();
    const totalParticipants = await BulkOrder.aggregate([
      {
        $group: {
          _id: null,
          totalFamilies: { $sum: "$totalFamilies" },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      totalBulkOrders,
      totalApartments,
      totalParticipants: totalParticipants[0]?.totalFamilies || 0,
      totalRevenue: totalParticipants[0]?.totalRevenue || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
