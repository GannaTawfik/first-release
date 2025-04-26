// src/modules/mapping/mapping.validation.js

import { body } from "express-validator";

export const validateMappingRequest = [
	body("userUploadedDataset")
		.exists()
		.withMessage("userUploadedDataset is required")
		.bail()
		.custom((value) => {
			if (!Array.isArray(value)) {
				throw new Error("userUploadedDataset must be an array of headers");
			}
			return true;
		}),
];

