import csv from "csv-parser";
import { createReadStream, writeFileSync, existsSync, mkdirSync } from "fs";
import { parse, stringify } from "csv/sync";
import { promisify } from "util";
import { pipeline } from "stream";
import { OriginalHeaders, HeaderMappings } from "./mapping.model.js";
import leven from "leven";
import path from "path";

const pipelineAsync = promisify(pipeline);

// Helper function for fuzzy matching
const fuzzyMatchHeaders = (originalHeaders, newHeaders) => {
	const threshold = 0.4; // Similarity threshold
	const mappings = [];

	for (const newHeader of newHeaders) {
		let bestMatch = { originalHeader: null, similarity: 0 };

		for (const originalHeader of originalHeaders) {
			const distance = leven(
				newHeader.toLowerCase(),
				originalHeader.toLowerCase()
			);
			const maxLength = Math.max(newHeader.length, originalHeader.length);
			const similarity = 1 - distance / maxLength;

			if (similarity > bestMatch.similarity && similarity >= threshold) {
				bestMatch = {
					originalHeader,
					similarity: parseFloat(similarity.toFixed(2)),
				};
			}
		}

		mappings.push({
			newHeader,
			originalHeader: bestMatch.originalHeader,
			similarity: bestMatch.similarity,
			mappedName: bestMatch.originalHeader || newHeader,
		});
	}

	return mappings;
};

export const extractHeaders = async (filePath) => {
	return new Promise((resolve, reject) => {
		const headers = [];
		const stream = createReadStream(filePath)
			.pipe(csv())
			.on("headers", (extractedHeaders) => {
				headers.push(...extractedHeaders);
				stream.destroy();
				resolve(headers);
			})
			.on("error", reject);
	});
};

export const saveOriginalHeaders = async (headers, fileInfo) => {
	try {
		await OriginalHeaders.deleteMany({});
		const newHeaders = new OriginalHeaders({ headers, fileInfo });
		await newHeaders.save();
		return newHeaders;
	} catch (error) {
		throw new Error("Failed to save original headers: " + error.message);
	}
};

export const processDataset = async (filePath) => {
	try {
		// Get original headers
		const originalDoc = await OriginalHeaders.findOne().sort({ createdAt: -1 });
		if (!originalDoc) throw new Error("No original headers found");
		const originalHeaders = originalDoc.headers;

		// Extract headers from new file
		const newHeaders = await extractHeaders(filePath);
		if (!newHeaders.length)
			throw new Error("No headers found in uploaded file");

		// Create mappings with fuzzy matching
		const mappings = fuzzyMatchHeaders(originalHeaders, newHeaders);

		// Read and process the CSV file
		const fileContent = await new Promise((resolve, reject) => {
			const chunks = [];
			createReadStream(filePath)
				.pipe(csv())
				.on("data", (chunk) => chunks.push(chunk))
				.on("end", () => resolve(chunks))
				.on("error", reject);
		});

		// Transform data with new headers
		const cleanedData = fileContent.map((row) => {
			const newRow = {};
			mappings.forEach((mapping) => {
				newRow[mapping.mappedName] = row[mapping.newHeader];
			});
			return newRow;
		});

		// Generate cleaned CSV
		const cleanedHeaders = mappings.map((m) => m.mappedName);
		const cleanedCsv = stringify(cleanedData, {
			header: true,
			columns: cleanedHeaders,
		});

		// Ensure uploads directory exists
		const uploadsDir = path.join(process.cwd(), "uploads");
		if (!existsSync(uploadsDir)) {
			mkdirSync(uploadsDir, { recursive: true });
		}

		// Save to cleaned file in uploads directory
		const cleanedFilename = `${Date.now()}_cleaned.csv`;
		const cleanedFilePath = path.join(uploadsDir, cleanedFilename);
		writeFileSync(cleanedFilePath, cleanedCsv);

		// Save mapping results
		const mappingDoc = new HeaderMappings({
			originalHeaders,
			newHeaders,
			mappings,
		});
		await mappingDoc.save();

		return {
			cleanedFilePath,
			cleanedFilename,
			mappings,
			originalHeaders,
			newHeaders,
			cleanedHeaders,
			recordCount: cleanedData.length,
		};
	} catch (error) {
		throw new Error(`Dataset processing failed: ${error.message}`);
	}
};

export const getOriginalHeaders = async () => {
	try {
		const doc = await OriginalHeaders.findOne().sort({ createdAt: -1 });
		return doc ? doc.headers : null;
	} catch (error) {
		throw new Error("Failed to fetch headers: " + error.message);
	}
};
