import { processAndMapCSVFiles } from "./mapping.service.js";
import { CleanedDataset, MappingModel } from "./mapping.model.js";
import fs from "fs";

export const uploadAndMapFiles = async (req, res) => {
	try {
		if (!req.files?.files || req.files.files.length !== 2) {
			return res.status(400).json({
				success: false,
				message: "Please upload exactly 2 CSV files",
				received: req.files?.files?.length || 0,
			});
		}

		const [originalFile, userFile] = req.files.files;
		const result = await processAndMapCSVFiles(originalFile, userFile);

		// Cleanup temp files
		[originalFile, userFile].forEach((file) => {
			if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
				fs.unlinkSync(file.tempFilePath);
			}
		});

		return res.status(200).json({
			success: true,
			message: "Files processed successfully",
			data: result,
		});
	} catch (error) {
		console.error("Upload Error:", error);

		// Cleanup on error
		if (req.files?.files) {
			req.files.files.forEach((file) => {
				if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
					try {
						fs.unlinkSync(file.tempFilePath);
					} catch (cleanupError) {
						console.error("Cleanup failed:", cleanupError);
					}
				}
			});
		}

		return res.status(500).json({
			success: false,
			message: error.message || "File processing failed",
		});
	}
};

export const getMappingHistory = async (req, res) => {
	try {
		const history = await MappingModel.find().sort({ createdAt: -1 });
		return res.status(200).json({
			success: true,
			count: history.length,
			data: history,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to fetch history",
			error: error.message,
		});
	}
};

export const getCleanedDataset = async (req, res) => {
	try {
		const dataset = await CleanedDataset.findById(req.params.id);
		if (!dataset) {
			return res.status(404).json({
				success: false,
				message: "Cleaned dataset not found",
			});
		}
		return res.status(200).json({
			success: true,
			data: dataset.cleanedData,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to fetch cleaned data",
			error: error.message,
		});
	}
};
