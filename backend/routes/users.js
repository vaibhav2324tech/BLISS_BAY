import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all users
router.get("/", authenticateToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "admin") {
      // Admin cannot view superadmins or admins
      query = { role: { $nin: ["admin", "superadmin"] } };
    }
    const users = await User.find(query).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new user
router.post("/", authenticateToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const { username, password, role, firstName, lastName } = req.body;

    if (req.user.role === "admin" && ["admin", "superadmin"].includes(role)) {
      return res.status(403).json({ success: false, message: "Admins cannot create Admins or SuperAdmins" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      firstName,
      lastName,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put("/:id", authenticateToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ success: false, message: "User not found" });

    if (req.user.role === "admin" && ["admin", "superadmin"].includes(userToUpdate.role)) {
      return res.status(403).json({ success: false, message: "Admins cannot update Admins or SuperAdmins" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    res.json({ success: true, message: "User updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete("/:id", authenticateToken, authorize("superadmin", "admin"), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ success: false, message: "User not found" });

    if (req.user.role === "admin" && ["admin", "superadmin"].includes(userToDelete.role)) {
      return res.status(403).json({ success: false, message: "Admins cannot delete Admins or SuperAdmins" });
    }

    await userToDelete.deleteOne();
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
