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

// Controller for top customers
export const topCustomers = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await sendFileToFlask(
			req.file.path,
			req.file.originalname,
			req.file.mimetype,
			"top_customers"
		);
		res.json({ top_customers: result.top_customers });
	} catch (error) {
		console.error("Backend error:", error);
		res.status(500).json({ error: "Error fetching top customers" });
	} finally {
		fs.unlinkSync(req.file.path); // Clean up uploaded file
	}
};

// Controller for monthly customer acquisition
export const monthlyCustomerAcquisition = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	try {
		const result = await sendFileToFlask(
			req.file.path,
			req.file.originalname,
			req.file.mimetype,
			"monthly_customer_acquisition"
		);
		res.json({ monthly_acquisition: result.monthly_acquisition });
	} catch (error) {
		console.error("Backend error:", error);
		res
			.status(500)
			.json({ error: "Error fetching monthly customer acquisition" });
	} finally {
		fs.unlinkSync(req.file.path); // Clean up uploaded file
	}
};
