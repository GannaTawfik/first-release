import { sendFileToFlask } from "../../utils/sendFileToFlask.js";
import fs from "fs";

export const getTopProducts = async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });

	try {
		const result = await sendFileToFlask(req.file, "top_products");
		res.json({ top_products: result.top_products });
	} catch (err) {
		console.error("Error in top_products:", err);
		res.status(500).json({ error: "Error fetching top products" });
	} finally {
		fs.unlinkSync(req.file.path);
	}
};

export const getProductReturnRate = async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" });

	try {
		const result = await sendFileToFlask(req.file, "product_return_rate");
		res.json({ product_return_rate: result.product_return_rate });
	} catch (err) {
		console.error("Error in product_return_rate:", err);
		res.status(500).json({ error: "Error fetching product return rate" });
	} finally {
		fs.unlinkSync(req.file.path);
	}
};
