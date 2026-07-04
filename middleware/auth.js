import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this-in-production";

/**
 * Verifies the Bearer token on the request and attaches the decoded
 * payload (userId, email, role) to req.user. Rejects with 401 if missing
 * or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header. Expected: 'Bearer <token>'." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Restricts a route to specific roles. Use after requireAuth.
 * Example: requireRole("regulator", "admin")
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `This action requires one of these roles: ${allowedRoles.join(", ")}.` });
    }
    return next();
  };
}

export { requireAuth, requireRole, JWT_SECRET };
