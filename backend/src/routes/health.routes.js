import { Router } from "express";
import { pool, testDatabaseConnection } from "../db.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "healthcare-dispensary-api",
    timestamp: new Date().toISOString()
  });
});

router.get("/db-check", async (_req, res) => {
  try {
    const connection = await testDatabaseConnection();
    const tableNames = [
      "state", "district", "dispensary", "healthcare_service",
      "dispensary_service", "dispensary_raw", "app_user",
      "dispensary_extra", "medicine", "dispensary_inventory",
      "appointment_request", "medicine_request", "medicine_request_item",
      "stock_transactions", "feedback", "audit_log"
    ];

    const counts = {};
    for (const table of tableNames) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      counts[table] = rows[0].total;
    }

    res.json({
      status: "connected",
      mysqlVersion: connection.mysql_version,
      database: connection.database_name,
      counts
    });
  } catch (error) {
    console.error("Database check failed:", error.message);
    res.status(500).json({
      status: "error",
      message: "Could not connect to the configured MySQL database or expected tables."
    });
  }
});

export default router;
