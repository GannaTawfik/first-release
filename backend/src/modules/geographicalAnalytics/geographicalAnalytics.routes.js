import express from "express";
import multer from "multer";
import {
	handleGeographicalAnalytics,
	handleCustomerActivityHeatmap,
} from "./geographicalAnalytics.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
	"/geographical_analysis",
	upload.single("file"),
	handleGeographicalAnalytics
);
router.post(
	"/customer_activity_heatmap",
	upload.single("file"),
	handleCustomerActivityHeatmap
);

export default router;
