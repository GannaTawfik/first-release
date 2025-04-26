import mongoose from "mongoose";

// Original mapping schema
const MappingSchema = new mongoose.Schema({
	originalDatasetName: { type: String, required: true },
	userUploadedDatasetName: { type: String, required: true },
	originalHeaders: [{ type: String }],
	userHeaders: [{ type: String }],
	headerMap: { type: Map, of: String },
	matchStats: {
		totalUserHeaders: Number,
		totalOriginalHeaders: Number,
		matchedHeaders: Number,
		unmatchedHeaders: Number,
		matchPercentage: Number,
	},
	createdAt: { type: Date, default: Date.now },
});

// New cleaned dataset schema
const CleanedDatasetSchema = new mongoose.Schema({
	mappingId: { type: mongoose.Schema.Types.ObjectId, ref: "Mapping" },
	originalHeaders: [String],
	cleanedData: [mongoose.Schema.Types.Mixed],
	createdAt: { type: Date, default: Date.now },
});

export const MappingModel = mongoose.model("Mapping", MappingSchema);
export const CleanedDataset = mongoose.model(
	"CleanedDataset",
	CleanedDatasetSchema
);
