import fs from "fs";
import { sendFileToFlask } from "./fileUpload.service.js";

export const uploadAndCleanCSV = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await sendFileToFlask(
			req.file.path,
			req.file.originalname,
			req.file.mimetype,
			"upload_csv"
		);
		res.json({
			message: "File uploaded and cleaned successfully",
			data: result,
		});
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error processing file" });
	} finally {
		fs.unlinkSync(req.file.path); // Clean up uploaded file
	}
};
