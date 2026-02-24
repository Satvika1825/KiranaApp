const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    bulkOrderId: { type: String, required: true, unique: true }, // e.g., "BULK-APT-001-20250224"
    apartment: { type: mongoose.Schema.Types.ObjectId, ref: "Apartment", required: true },
    orderWindow: { type: mongoose.Schema.Types.ObjectId, ref: "BulkOrderWindow" },
    participatingCustomers: [
      {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        items: [
          {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
            price: Number,
          },
        ],
        totalAmount: Number,
        shop: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    totalItems: { type: Number, default: 0 },
    totalFamilies: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    deliveryFeeDiscount: { type: Number, default: 0 }, // bulk ordering discount
    deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent" },
    deliverySlot: {
      startTime: String, // e.g., "19:00"
      endTime: String, // e.g., "20:30"
    },
    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
