const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const { checkCompliance } = require("../utils/checkCompliance");


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


router.get("/history", async (req, res) => {
  try {
    const { compliant, platform, limit } = req.query;
    const filter = {};
    if (compliant === "true") filter["result.compliant"] = true;
    if (compliant === "false") filter["result.compliant"] = false;
    if (platform) filter.platform = platform;

    const docs = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit, 10) : 50);

    return res.json({ count: docs.length, results: docs });
  } catch (err) {
    console.error("Error in /history:", err);
    return res.status(500).json({ error: "Internal server error while fetching history." });
  }
});


router.get("/history/:id", async (req, res) => {
  try {
    const doc = await Listing.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Listing not found." });
    return res.json(doc);
  } catch (err) {
    console.error("Error in /history/:id:", err);
    return res.status(500).json({ error: "Internal server error while fetching listing." });
  }
});

module.exports = router;
