import express from "express";
import Listing from "../models/Listing.js";
import { checkCompliance } from "../utils/checkCompliance.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All routes below require a valid Bearer token.
router.use(requireAuth);

/**
 * POST /api/check-listing
 * Body: a single product listing object
 * Runs the compliance rule engine, saves the result tagged to the
 * authenticated user, and returns it.
 */
router.post("/check-listing", async (req, res) => {
  try {
    const listing = req.body;

    if (!listing || typeof listing !== "object" || Array.isArray(listing)) {
      return res.status(400).json({ error: "Request body must be a single listing object." });
    }

    const result = checkCompliance(listing);

    const saved = await Listing.create({
      raw: listing,
      productTitle: listing.productTitle || "",
      platform: listing.platform || "unspecified",
      result,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      id: saved._id,
      productTitle: saved.productTitle,
      platform: saved.platform,
      ...result,
    });
  } catch (err) {
    console.error("Error in /check-listing:", err);
    return res.status(500).json({ error: "Internal server error while checking listing." });
  }
});

/**
 * POST /api/check-batch
 * Body: { listings: [ {...}, {...}, ... ] }
 * Runs the compliance rule engine over each listing, saves all tagged to
 * the authenticated user, returns array of results.
 */
router.post("/check-batch", async (req, res) => {
  try {
    const { listings } = req.body;

    if (!Array.isArray(listings) || listings.length === 0) {
      return res.status(400).json({ error: "Request body must include a non-empty 'listings' array." });
    }

    const results = [];
    for (const listing of listings) {
      const result = checkCompliance(listing);
      const saved = await Listing.create({
        raw: listing,
        productTitle: listing.productTitle || "",
        platform: listing.platform || "unspecified",
        result,
        createdBy: req.user.userId,
      });
      results.push({
        id: saved._id,
        productTitle: saved.productTitle,
        platform: saved.platform,
        ...result,
      });
    }

    const summary = {
      total: results.length,
      compliant: results.filter((r) => r.compliant).length,
      nonCompliant: results.filter((r) => !r.compliant).length,
    };

    return res.status(201).json({ summary, results });
  } catch (err) {
    console.error("Error in /check-batch:", err);
    return res.status(500).json({ error: "Internal server error while checking batch." });
  }
});

/**
 * GET /api/history
 * Optional query params: ?compliant=true|false, ?platform=Amazon, ?limit=20
 * Sellers see only their own checks. Regulators/admins see everyone's —
 * matching the real-world need for a regulator to audit across sellers.
 */
router.get("/history", async (req, res) => {
  try {
    const { compliant, platform, limit } = req.query;
    const filter = {};
    if (compliant === "true") filter["result.compliant"] = true;
    if (compliant === "false") filter["result.compliant"] = false;
    if (platform) filter.platform = platform;

    const isPrivileged = req.user.role === "regulator" || req.user.role === "admin";
    if (!isPrivileged) {
      filter.createdBy = req.user.userId;
    }

    const docs = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit, 10) : 50);

    return res.json({ count: docs.length, results: docs });
  } catch (err) {
    console.error("Error in /history:", err);
    return res.status(500).json({ error: "Internal server error while fetching history." });
  }
});

/**
 * GET /api/history/:id
 * Fetch a single past check by its Mongo _id. Sellers can only fetch
 * their own; regulators/admins can fetch any.
 */
router.get("/history/:id", async (req, res) => {
  try {
    const doc = await Listing.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Listing not found." });

    const isPrivileged = req.user.role === "regulator" || req.user.role === "admin";
    if (!isPrivileged && doc.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to view this listing." });
    }

    return res.json(doc);
  } catch (err) {
    console.error("Error in /history/:id:", err);
    return res.status(500).json({ error: "Internal server error while fetching listing." });
  }
});

export default router;
