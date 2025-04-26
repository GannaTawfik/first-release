import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export const sendFileToFlask = async (
	filePath,
	originalname,
	mimetype,
	endpoint
) => {
	const formData = new FormData();
	formData.append("file", fs.createReadStream(filePath), {
		filename: originalname,
		contentType: mimetype,
	});

	const response = await axios.post(
		`http://localhost:5000/${endpoint}`,
		formData,
		{
			headers: formData.getHeaders(),
		}
	);

	return response.data;
};
