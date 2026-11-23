import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function createToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
  }

  return jwt.sign(
    {
      userId: user.user_id,
      role: user.role,
      managedDispensaryId: user.managed_dispensary_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );
}

function publicUser(user) {
  return {
    userId: user.user_id,
    full_name: user.full_name,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    managed_dispensary_id: user.managed_dispensary_id,
    managedDispensaryId: user.managed_dispensary_id
  };
}

// Public registration is deliberately restricted to CLIENT accounts.
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body || {};

    if (
      typeof fullName !== "string" || fullName.trim().length < 2 ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8 ||
      (phone != null && typeof phone !== "string")
    ) {
      return res.status(400).json({
        message: "Provide a name, valid email, and password of at least 8 characters. Phone is optional."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO app_user
        (full_name, email, password_hash, phone, role, managed_dispensary_id)
       VALUES (?, ?, ?, ?, 'client', NULL)`,
      [fullName.trim(), normalizedEmail, passwordHash, phone?.trim() || null]
    );

    const user = {
      user_id: result.insertId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role: "client",
      managed_dispensary_id: null
    };

    return res.status(201).json({
      message: "Client account created successfully.",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.execute(
      `SELECT user_id, full_name, email, password_hash, role,
              managed_dispensary_id, is_active
       FROM app_user
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await pool.execute(
      "UPDATE app_user SET last_login_at = NOW() WHERE user_id = ?",
      [user.user_id]
    );

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Could not sign in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id, full_name, email, role, managed_dispensary_id, is_active
       FROM app_user WHERE user_id = ? LIMIT 1`,
      [req.user.userId]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Account is unavailable." });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Current-user error:", error);
    return res.status(500).json({ message: "Could not retrieve account." });
  }
});

export default router;
