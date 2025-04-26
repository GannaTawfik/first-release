import express from "express";
import { upload, handleMulterErrors } from "../../utils/multer.js";
import {
	uploadOriginalDataset,
	processDataset,
	downloadCleanedDataset,
} from "./mapping.controller.js";

const router = express.Router();

// Original headers setup
router.post(
	"/uploadOriginalDataset",
	upload.single("file"),
	handleMulterErrors,
	uploadOriginalDataset
);

// Dataset processing
router.post(
	"/processDataset",
	upload.single("file"),
	handleMulterErrors,
	processDataset
);

// File download
router.get("/download/:filename", downloadCleanedDataset);

export default router;
