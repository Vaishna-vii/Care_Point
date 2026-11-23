import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, allowRoles } from "../middleware/auth.js";

const router = Router();

// Only the Super Admin can create a dispensary-specific admin.
// There is intentionally no public admin registration route.
router.post(
  "/dispensary-admins",
  requireAuth,
  allowRoles("super_admin"),
  async (req, res) => {
    try {
      const { fullName, email, password, phone, dispensaryId } = req.body || {};
      const id = Number(dispensaryId);

      if (
        typeof fullName !== "string" || fullName.trim().length < 2 ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" || password.length < 8 ||
        !Number.isInteger(id) || id <= 0
      ) {
        return res.status(400).json({
          message: "Provide name, valid email, password (minimum 8 characters), and a valid dispensaryId."
        });
      }

      const [dispensaries] = await pool.execute(
        "SELECT dispensary_id FROM dispensary WHERE dispensary_id = ?",
        [id]
      );

      if (!dispensaries.length) {
        return res.status(404).json({ message: "Dispensary not found." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await pool.execute(
        `INSERT INTO app_user
          (full_name, email, password_hash, phone, role, managed_dispensary_id)
         VALUES (?, ?, ?, ?, 'dispensary_admin', ?)`,
        [fullName.trim(), email.trim().toLowerCase(), passwordHash, phone?.trim() || null, id]
      );

      return res.status(201).json({
        message: "Dispensary Admin created.",
        userId: result.insertId,
        dispensaryId: id
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      console.error("Create dispensary admin error:", error);
      return res.status(500).json({ message: "Could not create Dispensary Admin." });
    }
  }
);

export default router;
