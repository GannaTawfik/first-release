import fs from "fs";
import csv from "csv-parser";
import { MappingModel, CleanedDataset } from "./mapping.model.js";
import fuzzyMatch from "../../utils/fuzzyMatch.js";

// Configuration for large file handling
const STREAM_CONFIG = {
	highWaterMark: 1024 * 1024 * 32, // 32MB buffer size
	encoding: "utf-8",
};

const MAX_ROWS_BEFORE_PAUSE = 1000; // Process in chunks of 1000 rows

export const processAndMapCSVFiles = async (originalFile, userFile) => {
	try {
		// Validate and get file paths
		const originalFilePath = validateAndGetPath(originalFile);
		const userFilePath = validateAndGetPath(userFile);

		// Process both files in parallel
		const [originalHeaders, userHeaders] = await Promise.all([
			extractHeadersFromCSV(originalFilePath),
			extractHeadersFromCSV(userFilePath),
		]);

		// Create header mapping
		const headerMap = createHeaderMap(userHeaders, originalHeaders);

		// Calculate matching statistics
		const matchStats = {
			totalUserHeaders: userHeaders.length,
			totalOriginalHeaders: originalHeaders.length,
			matchedHeaders: Object.keys(headerMap).length,
			unmatchedHeaders: userHeaders.length - Object.keys(headerMap).length,
			matchPercentage: parseFloat(
				((Object.keys(headerMap).length / userHeaders.length) * 100).toFixed(2)
			),
		};

		// Process user file with proper streaming
		const cleanedData = await processFileWithStreaming(userFilePath, headerMap);

		// Save to database
		const [cleanedDataset] = await Promise.all([
			CleanedDataset.create({
				originalHeaders,
				cleanedData,
				mappingStats: matchStats,
			}),
			MappingModel.create({
				originalDatasetName: originalFile.name,
				userUploadedDatasetName: userFile.name,
				originalHeaders,
				userHeaders,
				headerMap,
				matchStats,
			}),
		]);

		return {
			headerMap,
			matchStats,
			cleanedDataId: cleanedDataset._id,
			sampleData: cleanedData.slice(0, 5), // Return first 5 rows as sample
		};
	} catch (error) {
		console.error("CSV Processing Error:", error);
		throw new Error(
			error.message.includes("offset")
				? "File too large. Please split into smaller files (max 100MB)"
				: error.message
		);
	}
};

// Helper Functions

function validateAndGetPath(file) {
	const path = file.tempFilePath || file.path;
	if (!path || !fs.existsSync(path)) {
		throw new Error(`Invalid file path: ${file.name}`);
	}
	return path;
}

function extractHeadersFromCSV(filePath) {
	return new Promise((resolve, reject) => {
		const headers = [];
		fs.createReadStream(filePath, STREAM_CONFIG)
			.pipe(csv())
			.on("headers", (h) => headers.push(...h))
			.on("data", () => {}) // Just to trigger parsing
			.on("end", () => resolve(headers))
			.on("error", reject);
	});
}

function createHeaderMap(userHeaders, originalHeaders) {
	const headerMap = {};
	const matches = fuzzyMatch(userHeaders, originalHeaders);

	userHeaders.forEach((header, index) => {
		if (matches[index]) {
			headerMap[header] = matches[index];
		}
	});

	return headerMap;
}

function processFileWithStreaming(filePath, headerMap) {
	return new Promise((resolve, reject) => {
		const cleanedData = [];
		let rowCount = 0;

		const stream = fs
			.createReadStream(filePath, STREAM_CONFIG)
			.pipe(csv())
			.on("data", (row) => {
				try {
					// Transform row according to header mapping
					const transformedRow = {};
					for (const [userHeader, value] of Object.entries(row)) {
						if (headerMap[userHeader]) {
							transformedRow[headerMap[userHeader]] = value;
						}
					}
					cleanedData.push(transformedRow);

					// Prevent memory overload
					if (++rowCount % MAX_ROWS_BEFORE_PAUSE === 0) {
						stream.pause();
						setImmediate(() => stream.resume());
					}
				} catch (rowError) {
					stream.destroy();
					reject(
						new Error(`Error processing row ${rowCount}: ${rowError.message}`)
					);
				}
			})
			.on("end", () => resolve(cleanedData))
			.on("error", reject);
	});
}
