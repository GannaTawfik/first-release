import express from "express";
import multer from "multer";
import {
	getTopProducts,
	getProductReturnRate,
} from "./productAnalytics.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/top_products", upload.single("file"), getTopProducts);
router.post(
	"/product_return_rate",
	upload.single("file"),
	getProductReturnRate
);

export default router;
