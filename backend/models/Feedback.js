import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  rating: Number,
  comment: String,
  waiterTip: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Feedback", FeedbackSchema);
