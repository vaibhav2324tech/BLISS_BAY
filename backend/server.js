import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

// Route Imports
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import tableRoutes from "./routes/tables.js";
import billingRoutes from "./routes/billing.js";
import feedbackRoutes from "./routes/feedback.js";

// Middleware Imports
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to requests (so routes can emit events)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/feedback", feedbackRoutes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a role-based room (waiter, kitchen, cashier, admin, superadmin)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room: ${room}`);
  });

  // Join a table-specific room (for guest order tracking)
  socket.on("join-table", (tableId) => {
    socket.join(`table:${tableId}`);
    console.log(`🍽️ Socket ${socket.id} joined table room: table:${tableId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

start();

export { app, io };
