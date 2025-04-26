import { sendFileToFlask } from "../../utils/sendFileToFlask.js";

export const processGeographicalAnalytics = async (file) => {
	return await sendFileToFlask(
		file.path,
		file.originalname,
		file.mimetype,
		"geographical_analysis"
	);
};

export const processCustomerActivityHeatmap = async (file) => {
	return await sendFileToFlask(
		file.path,
		file.originalname,
		file.mimetype,
		"customer_activity_heatmap"
	);
};
