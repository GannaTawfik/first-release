import * as mappingService from "./mapping.service.js";
import { unlink } from "fs/promises";
import { performance } from "perf_hooks";
import path from "path"; // Add this import
import fs from "fs";

export const uploadOriginalDataset = async (req, res) => {
	const startTime = performance.now();

	if (!req.file) {
		return res.status(400).json({
			success: false,
			message: "No file uploaded",
			timestamp: new Date().toISOString(),
		});
	}

	try {
		const headers = await mappingService.extractHeaders(req.file.path);
		if (!headers.length) throw new Error("No headers found in CSV file");

		const saveResult = await mappingService.saveOriginalHeaders(
			headers,
			req.file
		);
		await unlink(req.file.path);

		return res.status(200).json({
			success: true,
			message: "Original headers saved successfully",
			headers,
			dbResponse: saveResult,
			processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (req.file?.path) await unlink(req.file.path);
		return res.status(500).json({
			success: false,
			message: error.message,
			timestamp: new Date().toISOString(),
		});
	}
};

export const processDataset = async (req, res) => {
	const startTime = performance.now();

	if (!req.file) {
		return res.status(400).json({
			success: false,
			message: "No file uploaded",
			timestamp: new Date().toISOString(),
		});
	}

	try {
		const result = await mappingService.processDataset(req.file.path);
		const cleanedFilename = path.basename(result.cleanedFilePath);

		return res.status(200).json({
			success: true,
			message: "Dataset processed successfully",
			downloadUrl: `/api/download/${cleanedFilename}`,
			mappings: result.mappings,
			stats: {
				originalHeaders: result.originalHeaders,
				newHeaders: result.newHeaders,
				cleanedHeaders: result.cleanedHeaders,
				recordCount: result.recordCount,
			},
			processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (req.file?.path) await unlink(req.file.path).catch(console.error);
		return res.status(500).json({
			success: false,
			message: error.message,
			timestamp: new Date().toISOString(),
		});
	}
};

export const downloadCleanedDataset = async (req, res) => {
	try {
		const uploadsDir = path.join(process.cwd(), "uploads");
		const filePath = path.join(uploadsDir, req.params.filename);

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({
				success: false,
				message: "File not found or already downloaded",
				timestamp: new Date().toISOString(),
			});
		}

		res.download(filePath, (err) => {
			if (err) {
				console.error("Download error:", err);
				return res.status(500).json({
					success: false,
					message: "Error downloading file",
					timestamp: new Date().toISOString(),
				});
			}

			// Delete file after download completes
			fs.unlink(filePath, (err) => {
				if (err) console.error("Error deleting file:", err);
			});
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
			timestamp: new Date().toISOString(),
		});
	}
};
