import express from "express";
import { upload } from "../../utils/multer.js";
import { rfmAnalysisController } from "./rfmAnalysis.controller.js";

const router = express.Router();

// Perform RFM analysis
router.post("/rfm_analysis", upload.single("file"), rfmAnalysisController);

export default router;
