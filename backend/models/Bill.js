import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  subtotal: Number,
  gst: Number,
  serviceCharge: Number,
  total: Number,
  paymentMethod: { type: String, enum: ["cash", "card", "upi", "wallet"], default: "cash" },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Bill", BillSchema);
