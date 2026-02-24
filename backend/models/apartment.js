const mongoose = require("mongoose");

const apartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    totalFamilies: { type: Number, default: 0 },
    registeredFamilies: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deliveryRadius: { type: Number, default: 5 }, // in km
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // typically admin
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Apartment", apartmentSchema);
