const mongoose = require("mongoose");

const bulkOrderWindowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Evening Ordering"
    startTime: { type: String, required: true }, // e.g., "18:00" (24-hour format)
    endTime: { type: String, required: true }, // e.g., "19:00"
    daysOfWeek: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
    isActive: { type: Boolean, default: true },
    apartment: { type: mongoose.Schema.Types.ObjectId, ref: "Apartment", required: true },
    deliveryDate: { type: Date }, // date when grouped orders will be delivered
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkOrderWindow", bulkOrderWindowSchema);
