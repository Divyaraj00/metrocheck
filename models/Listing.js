import mongoose from "mongoose";

// Kept loose/flexible on purpose — real-world listings from different
// sellers won't have a uniform shape, so we store the raw submitted
// data as-is plus the computed compliance result.
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Listing", ListingSchema);
