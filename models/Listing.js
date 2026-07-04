const mongoose = require("mongoose");


const ListingSchema = new mongoose.Schema(
  {
    raw: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    productTitle: {
      type: String,
      default: "",
    },
    platform: {
      type: String, // e.g. "Amazon", "Flipkart", "Meesho", manual entry, etc.
      default: "unspecified",
    },
    result: {
      compliant: { type: Boolean, required: true },
      violations: { type: [String], default: [] },
      checkedAt: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", ListingSchema);
