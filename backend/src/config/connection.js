import mongoose from "mongoose";

const connectDB = async () => {
	// Skip if already connected
	if (mongoose.connection.readyState === 1) {
		console.log("Using existing MongoDB connection");
		return;
	}

	try {
		const conn = await mongoose.connect(
			process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mappedHeaders",
			{
				maxPoolSize: 10,
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,
				connectTimeoutMS: 30000,
			}
		);
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`MongoDB connection error: ${error.message}`);
		// Retry after 5 seconds
		setTimeout(connectDB, 5000);
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

export default connectDB;
