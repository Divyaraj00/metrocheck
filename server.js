import "dotenv/config";

// DNS fix for SRV lookup issues on some networks/ISPs (safe to keep even if not needed)
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/metrocheck";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Simple health check — useful for confirming the server is up
// without needing the DB connection.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    dbConnected: mongoose.connection.readyState === 1,
    time: new Date().toISOString(),
  });
});

app.use("/api", authRoutes);
app.use("/api", listingRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected:", MONGODB_URI);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Server will still start, but /api routes that need the DB will fail until MongoDB is reachable.");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

start();

export default app;
