import mongoose from "mongoose";

const originalHeadersSchema = new mongoose.Schema({
	headers: {
		type: [String],
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	fileInfo: {
		originalName: String,
		size: Number,
		encoding: String,
		mimetype: String,
	},
});

const headerMappingsSchema = new mongoose.Schema({
	originalHeaders: [String],
	newHeaders: [String],
	mappings: [
		{
			newHeader: String,
			originalHeader: String,
			similarity: Number,
			mappedName: String,
		},
	],
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const OriginalHeaders = mongoose.model(
	"OriginalHeaders",
	originalHeadersSchema,
	"originalHeaders"
);

export const HeaderMappings = mongoose.model(
	"HeaderMappings",
	headerMappingsSchema,
	"headerMappings"
);
