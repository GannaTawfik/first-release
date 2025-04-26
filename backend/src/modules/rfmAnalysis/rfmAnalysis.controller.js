import { performRFMAnalysis } from "./rfmAnalysis.service.js";

export const rfmAnalysisController = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await performRFMAnalysis(
			req.file.path,
			req.file.originalname,
			req.file.mimetype
		);
		res.json({ segment_data: result.segment_data });
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error performing RFM analysis" });
	} finally {
		// Clean up uploaded file
		fs.unlinkSync(req.file.path);
	}
};
