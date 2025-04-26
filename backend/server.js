// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import fileUpload from "express-fileupload";
import connectDB from "./src/config/connection.js";
import morgan from "morgan";
import fs from "fs";

// Route imports
// import fileUploadRoutes from "./src/modules/fileUpload/fileUpload.routes.js";
import rfmAnalysisRoutes from "./src/modules/rfmAnalysis/rfmAnalysis.routes.js";
import modelTrainingRoutes from "./src/modules/modelTraining/modelTraining.routes.js";
import revenueAnalyticsRoutes from "./src/modules/revenueAnalytics/revenueAnalytics.routes.js";
import customerAnalyticsRoutes from "./src/modules/customerAnalytics/customerAnalytics.routes.js";
import productAnalyticsRoutes from "./src/modules/productAnalytics/productAnalytics.routes.js";
import geographicalAnalyticsRoutes from "./src/modules/geographicalAnalytics/geographicalAnalytics.routes.js";
import mappingRoutes from "./src/modules/mapping/mapping.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Get directory path (for temp files)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists
const tempDir = path.join(__dirname, "tmp");
if (!existsSync(tempDir)) {
	mkdirSync(tempDir);
}

// Connection state
let dbReady = false;

// --- MIDDLEWARES --- //
// Setup file uploads
// app.use(
// 	fileUpload({
// 		useTempFiles: true,
// 		tempFileDir: tempDir,
// 		createParentPath: true,
// 		limits: { fileSize: 500 * 1024 * 1024, files: 2 },
// 		abortOnLimit: true,
// 		responseOnLimit: "Please upload exactly 2 CSV files",
// 		safeFileNames: true,
// 		preserveExtension: 4,
// 	})
// );

// Built-in middlewares
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Logger
app.use(morgan("dev"));

// Middleware to check DB status
app.use((req, res, next) => {
	if (!dbReady) {
		return res.status(503).json({
			success: false,
			message: "Database not ready, try again later.",
		});
	}
	next();
});

// --- ROUTES --- //
// app.use("/api", fileUploadRoutes);
app.use("/api", rfmAnalysisRoutes);
app.use("/api/modelTraining", modelTrainingRoutes);
app.use("/api/revenue_analytics", revenueAnalyticsRoutes);
app.use("/api/customer_analytics", customerAnalyticsRoutes);
app.use("/api/product_analytics", productAnalyticsRoutes);
app.use("/api", geographicalAnalyticsRoutes);
app.use("/api", mappingRoutes);

// Health check
app.get("/api/health", (req, res) => {
	const memoryUsage = process.memoryUsage();
	res.json({
		status: "OK",
		database: dbReady ? "Connected" : "Disconnected",
		uptime: process.uptime(),
		memory: {
			rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
			heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
			heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
		},
		timestamp: new Date(),
	});
});

// Cleanup temporary files after response
app.use((req, res, next) => {
	res.on("finish", () => {
		if (req.files) {
			Object.values(req.files).forEach((fileArray) => {
				(Array.isArray(fileArray) ? fileArray : [fileArray]).forEach((file) => {
					if (file.tempFilePath && existsSync(file.tempFilePath)) {
						unlinkSync(file.tempFilePath);
					}
				});
			});
		}
	});
	next();
});

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);

	if (err.code === "LIMIT_FILE_SIZE") {
		return res
			.status(413)
			.json({ success: false, message: "File too large (max 500MB)" });
	}
	if (err.code === "LIMIT_FILE_COUNT") {
		return res
			.status(400)
			.json({ success: false, message: "Maximum of 2 files allowed" });
	}

	res.status(500).json({
		success: false,
		message: "Internal server error",
		...(process.env.NODE_ENV === "development" && { error: err.message }),
	});
});

// --- DATABASE CONNECTION HANDLING --- //
const initializeServer = async () => {
	try {
		await connectDB();
		dbReady = true;
		console.log("✅ Database connection established");

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
			console.log(`🔗 http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("❌ Failed to initialize server:", error.message);
		process.exit(1);
	}
};

mongoose.connection.on("disconnected", () => {
	dbReady = false;
	console.log("⚠️ MongoDB disconnected");

	let retryDelay = 5000;
	const reconnect = () => {
		connectDB()
			.then(() => {
				dbReady = true;
				console.log("♻️ MongoDB reconnected");
			})
			.catch((err) => {
				console.error(
					`Retrying MongoDB connection in ${retryDelay / 1000}s...`,
					err.message
				);
				setTimeout(reconnect, retryDelay);
				retryDelay = Math.min(retryDelay * 2, 30000);
			});
	};

	setTimeout(reconnect, retryDelay);
});

// Graceful shutdown
const shutdown = async () => {
	try {
		console.log("\n🛑 Shutting down server...");
		await mongoose.connection.close();
		console.log("⏏️ MongoDB connection closed");
		process.exit(0);
	} catch (err) {
		console.error("Shutdown error:", err);
		process.exit(1);
	}
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Uncaught exception handling
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	shutdown();
});

// Start the server
initializeServer();
