import express from "express";
import MenuItem from "../models/MenuItem.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error.message
    });
  }
});

// Get menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu item",
      error: error.message
    });
  }
});

// Create menu item (Admin/Manager only)
router.post("/", authenticateToken, authorize("admin", "manager"), async (req, res) => {
  try {
    const menuItem = new MenuItem({
      ...req.body,
      createdBy: req.user._id
    });
    await menuItem.save();

    // Notify connected clients about menu update
    if (req.io) {
      req.io.emit("menu-update", {
        action: "create",
        item: menuItem
      });
    }

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: menuItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating menu item",
      error: error.message
    });
  }
});

// Update menu item (Admin/Manager only)
router.put("/:id", authenticateToken, authorize("admin", "manager"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastModifiedBy: req.user._id
      },
      { new: true }
    );

    // Notify connected clients about menu update
    if (req.io) {
      req.io.emit("menu-update", {
        action: "update",
        item: updatedItem
      });
    }

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating menu item",
      error: error.message
    });
  }
});

// Delete menu item (Admin only)
router.delete("/:id", authenticateToken, authorize("admin"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    await menuItem.deleteOne();

    // Notify connected clients about menu update
    if (req.io) {
      req.io.emit("menu-update", {
        action: "delete",
        itemId: req.params.id
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting menu item",
      error: error.message
    });
  }
});

// Get menu items by category
router.get("/category/:category", async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ 
      category: req.params.category,
      isAvailable: true 
    }).sort({ name: 1 });
    
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error.message
    });
  }
});

// Toggle item availability (Manager/Admin)
router.patch("/:id/toggle-availability", authenticateToken, authorize("admin", "manager"), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    menuItem.lastModifiedBy = req.user._id;
    await menuItem.save();

    // Notify connected clients about menu update
    if (req.io) {
      req.io.emit("menu-update", {
        action: "availability-change",
        item: menuItem
      });
    }

    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling menu item availability",
      error: error.message
    });
  }
});

export default router;
