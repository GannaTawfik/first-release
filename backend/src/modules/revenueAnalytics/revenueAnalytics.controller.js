import fs from "fs";
import axios from "axios";
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

// Controller for monthly revenue
export const monthlyRevenue = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await sendFileToFlask(
			req.file.path,
			req.file.originalname,
			req.file.mimetype,
			"monthly_revenue"
		);
		res.json({ monthly_revenue: result.monthly_revenue });
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error fetching monthly revenue" });
	} finally {
		fs.unlinkSync(req.file.path); // Clean up uploaded file
	}
};

// Controller for daily revenue
export const dailyRevenue = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await sendFileToFlask(
			req.file.path,
			req.file.originalname,
			req.file.mimetype,
			"daily_revenue"
		);
		res.json({ daily_revenue: result.daily_revenue });
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error fetching daily revenue" });
	} finally {
		fs.unlinkSync(req.file.path); // Clean up uploaded file
	}
};
