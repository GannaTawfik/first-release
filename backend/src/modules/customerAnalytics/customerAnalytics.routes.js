import express from "express";
import multer from "multer";
import {
	topCustomers,
	monthlyCustomerAcquisition,
} from "./customerAnalytics.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Endpoint for top customers
router.post("/top_customers", upload.single("file"), topCustomers);

// Endpoint for monthly customer acquisition
router.post(
	"/monthly_customer_acquisition",
	upload.single("file"),
	monthlyCustomerAcquisition
);

export default router;
