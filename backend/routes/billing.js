import express from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * 💳 Process payment for a table
 */
router.post("/pay/:tableId", authenticateToken, authorize("cashier", "admin"), async (req, res) => {
  try {
    const { tableId } = req.params;
    const { method } = req.body; // cash, card, UPI, etc.

    // Mark all active orders for this table as paid
    const orders = await Order.updateMany(
      { table: tableId, status: { $ne: "paid" } },
      { status: "paid" }
    );

    // Free the table
    await Table.findByIdAndUpdate(tableId, { status: "available", currentOrder: null });

    // 🔴 Emit to Guest + Staff
    req.io.to(`table:${tableId}`).emit("bill:paid", { tableId, method });
    req.io.to("cashier").emit("bill:paid", { tableId, method });
    req.io.to("waiter").emit("bill:paid", { tableId, method });
    req.io.to("admin").emit("bill:paid", { tableId, method });

    res.json({ success: true, message: "Payment processed", data: { tableId, method } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error processing payment", error: error.message });
  }
});

export default router;
