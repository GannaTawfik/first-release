// src/modules/modelTraining/modelTraining.service.js

import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// Helper function to send file to Flask backend
const sendFileToFlask = async (filePath, originalname, mimetype, endpoint) => {
	const formData = new FormData();
	formData.append("file", fs.createReadStream(filePath), {
		filename: originalname,
		contentType: mimetype,
	});

	const response = await axios.post(
		`http://localhost:5000/${endpoint}`,
		formData,
		{
			headers: {
				...formData.getHeaders(),
			},
		}
	);

	return response.data;
};

// Train model logic
export const trainModel = async (file) => {
	try {
		const result = await sendFileToFlask(
			file.path,
			file.originalname,
			file.mimetype,
			"train_model"
		);
		fs.unlinkSync(file.path); // Clean up uploaded file
		return result;
	} catch (error) {
		console.error("Error in model training:", error);
		throw new Error("Error training model");
	}
};

// Fetch model results logic
export const fetchModelResults = async () => {
	try {
		// Placeholder for any additional logic to fetch model results
		return { success: true, message: "Model results fetched successfully" };
	} catch (error) {
		console.error("Error in fetching model results:", error);
		throw new Error("Error fetching model results");
	}
};
