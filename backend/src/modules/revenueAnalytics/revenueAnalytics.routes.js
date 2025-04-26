import express from "express";
import multer from "multer";
import { monthlyRevenue, dailyRevenue } from "./revenueAnalytics.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Endpoint for monthly revenue
router.post("/monthly_revenue", upload.single("file"), monthlyRevenue);

// Endpoint for daily revenue
router.post("/daily_revenue", upload.single("file"), dailyRevenue);

export default router;
