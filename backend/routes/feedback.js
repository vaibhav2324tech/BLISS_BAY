import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

// Submit feedback
router.post("/", async (req, res) => {
  const fb = new Feedback(req.body);
  await fb.save();
  res.json(fb);
});

// List feedback
router.get("/", async (req, res) => {
  const fb = await Feedback.find();
  res.json(fb);
});

export default router;
