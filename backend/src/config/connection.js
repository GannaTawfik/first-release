import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MAX_RETRY_ATTEMPTS = 5;
let retryCount = 0;

const connectDB = async () => {
	if (mongoose.connection.readyState === 1) {
		console.log("Using existing MongoDB connection");
		return;
	}

	try {
		const conn = await mongoose.connect(
			process.env.MONGO_URI || "mongodb://127.0.0.1:27017/GP_RFM", // Changed to GP_RFM
			{
				maxPoolSize: 10,
				serverSelectionTimeoutMS: 10000,
				socketTimeoutMS: 45000,
				connectTimeoutMS: 30000,
				retryWrites: true,
				retryReads: true,
			}
		);
		retryCount = 0;
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		retryCount++;
		console.error(
			`MongoDB connection error (Attempt ${retryCount}): ${error.message}`
		);

		if (retryCount < MAX_RETRY_ATTEMPTS) {
			setTimeout(connectDB, 5000 * retryCount);
		} else {
			console.error("Max retry attempts reached. Exiting...");
			process.exit(1);
		}
	}
};

// Event listeners
mongoose.connection.on("connecting", () =>
	console.log("Connecting to MongoDB...")
);

mongoose.connection.on("disconnected", () => {
	console.log("MongoDB disconnected! Attempting to reconnect...");
	setTimeout(connectDB, 5000);
});

mongoose.connection.on("error", (err) =>
	console.error("MongoDB connection error:", err)
);

export default connectDB;
