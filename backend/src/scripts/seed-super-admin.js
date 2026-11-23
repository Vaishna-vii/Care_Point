import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

dotenv.config();

async function main() {
  const fullName = process.env.SUPER_ADMIN_NAME?.trim();
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!fullName || !email || !password || password.length < 12) {
    throw new Error(
      "Set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and a SUPER_ADMIN_PASSWORD of at least 12 characters in .env."
    );
  }

  const [existing] = await pool.execute(
    "SELECT user_id, role FROM app_user WHERE email = ? LIMIT 1",
    [email]
  );

  if (existing.length) {
    console.log(`An account with ${email} already exists (role: ${existing[0].role}). No changes made.`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    `INSERT INTO app_user
      (full_name, email, password_hash, role, managed_dispensary_id)
     VALUES (?, ?, ?, 'super_admin', NULL)`,
    [fullName, email, hash]
  );

  console.log(`Super Admin created. User ID: ${result.insertId}`);
}

main()
  .catch((error) => {
    console.error("Super Admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
