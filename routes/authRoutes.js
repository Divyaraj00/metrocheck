import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = express.Router();
const TOKEN_EXPIRY = "7d";

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * role defaults to "seller" if not provided. Only trust self-declared
 * "regulator"/"admin" roles in a real deployment behind an invite/approval
 * step — left open here for demo simplicity.
 */
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: ["seller", "regulator", "admin"].includes(role) ? role : "seller",
    });

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Error in POST /auth/register:", err);
    return res.status(500).json({ error: "Internal server error while registering." });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Error in POST /auth/login:", err);
    return res.status(500).json({ error: "Internal server error while logging in." });
  }
});

export default router;
