const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true
    },

    dosage: {
      type: String,
      default: ""
    },

    strength: {
      type: String,
      default: ""
    },

    manufacturer: {
      type: String,
      default: ""
    },

    indication: {
      type: String,
      default: ""
    },

    classification: {
      type: String,
      default: ""
    },

    manufacturingDate: {
      type: Date,
      default: null
    },

    expiryDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      default: "Available"
    },

    batchNumber: {
      type: String,
      default: ""
    },

    quantity: {
      type: Number,
      default: 0
    },

    minStock: {
      type: Number,
      default: 10
    },

    price: {
      type: Number,
      default: 0
    },

    supplier: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Medicine", medicineSchema);