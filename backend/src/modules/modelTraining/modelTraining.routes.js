// src/modules/modelTraining/modelTraining.routes.js

import express from "express";
import multer from "multer";
import {
	trainModelController,
	getModelResultsController,
} from "./modelTraining.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Route for training the model
router.post("/train_model", upload.single("file"), trainModelController);

// Route to fetch model results (if needed)
router.get("/model_results", getModelResultsController);

export default router;
