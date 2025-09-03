import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  // tableId:{type:String},
  items: [{ name: String, quantity: Number, price: Number }],
  status: { type: String, enum: ["PENDING", "PREPARING", "READY", "SERVED"], default: "PENDING" },
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
