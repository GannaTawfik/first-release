import express from "express";
import {
	uploadAndMapFiles,
	getMappingHistory,
	getCleanedDataset,
} from "./mapping.controller.js";

const router = express.Router();

// File upload and mapping endpoint
router.post("/upload", uploadAndMapFiles);

// Get mapping history endpoint
router.get("/history", getMappingHistory);

// Get cleaned dataset endpoint
router.get("/cleaned-data/:id", getCleanedDataset);

export default router;
