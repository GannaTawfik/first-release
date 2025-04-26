import fs from "fs";
import { sendFileToFlask } from "../../utils/sendFileToFlask.js";
import {
	processGeographicalAnalytics,
	processCustomerActivityHeatmap,
} from "./geographicalAnalytics.service.js";

export const handleGeographicalAnalytics = async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });

	try {
		const result = await processGeographicalAnalytics(req.file);
		res.json({ geographical_revenue: result.geographical_revenue });
	} catch (error) {
		console.error("Geographical Analytics Error:", error);
		res.status(500).json({ error: "Error fetching geographical analysis" });
	} finally {
		fs.unlinkSync(req.file.path);
	}
};

export const handleCustomerActivityHeatmap = async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });

	try {
		const result = await processCustomerActivityHeatmap(req.file);
		res.json({ activity_heatmap: result.activity_heatmap });
	} catch (error) {
		console.error("Heatmap Error:", error);
		res.status(500).json({ error: "Error fetching customer activity heatmap" });
	} finally {
		fs.unlinkSync(req.file.path);
	}
};
