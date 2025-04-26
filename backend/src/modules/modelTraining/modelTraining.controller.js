// src/modules/modelTraining/modelTraining.controller.js

import { trainModel, fetchModelResults } from "./modelTraining.service.js";

// Train model
export const trainModelController = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await trainModel(req.file);
		res.json({
			confusion_matrix: result.confusion_matrix,
			classification_report: result.classification_report,
		});
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error training model" });
	}
};

// Get model results (if needed)
export const getModelResultsController = async (req, res) => {
	try {
		const result = await fetchModelResults();
		res.json(result);
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error fetching model results" });
	}
};
