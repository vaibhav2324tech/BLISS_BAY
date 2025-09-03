import express from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import Menu from "../models/Menu.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

/**
 * 📌 Place new order (Guest flow)
 * Body: { tableId, items: [{name, price, qty}] }
 */
router.post("/", async (req, res) => {
  try {
    // console.log(req.body)
    const { tableNumber, items } = req.body;
    // console.log(tableNumber,items)

    let tableId = tableNumber;

    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

      const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    // console.log(table)


        // 🛠 Transform items (fetch name + price from Menu)
    const populatedItems = await Promise.all(
      items.map(async (it) => {
        // console.log(it)
        // const menuItem = await Menu.findById(it.menuItem);
        const menuItem = await MenuItem.findOne({ _id: it.menuItem });
        // console.log(menuItem)
        if (!menuItem) throw new Error(`Menu item not found: ${it.menuItem}`);
        return {
          name: menuItem.name,
          quantity: it.quantity,
          price: menuItem.price,
        };
      })
    );

    // console.log(populatedItems)

    const order = new Order({
      tableId: table._id,
      items:populatedItems,
      status: "PENDING",
    });

    await order.save();

    // Update table's current order
    // await Table.findByIdAndUpdate(tableId, { currentOrder: order._id, status: "occupied" });

    // 🔴 Emit to all staff dashboards
    // req.io.to("kitchen").emit("order:new", order);
    // req.io.to("waiter").emit("order:new", order);
    // req.io.to("cashier").emit("order:new", order);
    // req.io.to("admin").emit("order:new", order);

    // 🔴 Emit to guest table room
    // req.io.to(`table:${tableId}`).emit("order:placed", order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error placing order", error: error.message });
  }
});

/**
 * 📌 Update order status (Kitchen / Waiter / Cashier)
 * PUT /api/orders/:id/status
 */
router.put("/:id/status", authenticateToken, authorize("kitchen", "waiter", "cashier", "admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("table", "tableNumber");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 🔴 Emit to staff dashboards
    req.io.emit("order:update", order);

    // 🔴 Notify guest at this table
    req.io.to(`table:${order.table._id}`).emit("order:update", order);

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating order", error: error.message });
  }
});

/**
 * 📌 Get all orders (Admin / Manager)
 */
// router.get("/", authenticateToken, authorize("admin", "superadmin", "manager"), async (req, res) => {
router.get("/:id", async (req, res) => {
  try {

    console.log(req.params.id)
    const order = await Order.findById(req.params.id)
      // .populate("table", "tableNumber")
      // .populate("items.menuItem", "name price") // important: to get menu details
      // .exec();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
  }
});


export default router;
