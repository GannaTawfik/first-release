import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url"; // Added this import
import fileUpload from "express-fileupload";
import connectDB from "./src/config/connection.js";

// Route imports
import fileUploadRoutes from "./src/modules/fileUpload/fileUpload.routes.js";
import rfmAnalysisRoutes from "./src/modules/rfmAnalysis/rfmAnalysis.routes.js";
import modelTrainingRoutes from "./src/modules/modelTraining/modelTraining.routes.js";
import revenueAnalyticsRoutes from "./src/modules/revenueAnalytics/revenueAnalytics.routes.js";
import customerAnalyticsRoutes from "./src/modules/customerAnalytics/customerAnalytics.routes.js";
import productAnalyticsRoutes from "./src/modules/productAnalytics/productAnalytics.routes.js";
import geographicalAnalyticsRoutes from "./src/modules/geographicalAnalytics/geographicalAnalytics.routes.js";
import mappingRoutes from "./src/modules/mapping/mapping.routes.js";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connection state tracking
let dbReady = false;

// Initialize database connection
const initializeServer = async () => {
	try {
		await connectDB();
		dbReady = true;
		console.log("✅ Database connection established");

		// Ensure temp directory exists
		const tempDir = path.join(__dirname, "tmp");
		if (!existsSync(tempDir)) {
			mkdirSync(tempDir);
		}

		// Enhanced file upload configuration
		app.use(
			fileUpload({
				useTempFiles: true,
				tempFileDir: tempDir,
				createParentPath: true,
				limits: {
					fileSize: 500 * 1024 * 1024, // 500MB
					files: 2, // Exactly 2 files required
				},
				abortOnLimit: true,
				responseOnLimit: "Please upload exactly 2 CSV files",
				safeFileNames: true,
				preserveExtension: 4, // Keep .csv extension
			})
		);
		// Add this RIGHT AFTER fileUpload middleware
		app.use((req, res, next) => {
			req.on("data", () => {});
			req.on("end", next);
		});

		// Middleware
		app.use(cors());
		app.use(express.json({ limit: "500mb" }));
		app.use(express.urlencoded({ limit: "500mb", extended: true }));

		// Database connection check middleware
		app.use((req, res, next) => {
			if (!dbReady) {
				return res.status(503).json({
					success: false,
					message: "Database connection not ready",
					solution: "Please wait a moment and try again",
				});
			}
			next();
		});

		// Error handling middleware
		app.use((err, req, res, next) => {
			console.error(err.stack);

			// Handle file upload limit errors specifically
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(413).json({
					success: false,
					message: "File too large (max 500MB)",
				});
			}

			if (err.code === "LIMIT_FILE_COUNT") {
				return res.status(400).json({
					success: false,
					message: "Maximum of 2 files allowed",
				});
			}

			res.status(500).json({
				success: false,
				message: "Internal server error",
				...(process.env.NODE_ENV === "development" && { error: err.message }),
			});
		});
		// Add this BEFORE your routes in server.js
		app.use((req, res, next) => {
			req.on("data", () => {}); // Keep connection alive
			next();
		});

		// Routes
		app.use("/api", fileUploadRoutes);
		app.use("/api", rfmAnalysisRoutes);
		app.use("/api/modelTraining", modelTrainingRoutes);
		app.use("/api/revenue_analytics", revenueAnalyticsRoutes);
		app.use("/api/customer_analytics", customerAnalyticsRoutes);
		app.use("/api/product_analytics", productAnalyticsRoutes);
		app.use("/api", geographicalAnalyticsRoutes);
		app.use("/api/mapping", mappingRoutes);

		// Enhanced health check endpoint
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

		// Start server
		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
			console.log(`🔗 http://localhost:${PORT}`);
			console.log(`📁 Temporary upload directory: ${tempDir}`);
		});
	} catch (error) {
		console.error("❌ Failed to initialize server:", error.message);
		process.exit(1);
	}
};

// Enhanced database connection handling
mongoose.connection.on("disconnected", () => {
	dbReady = false;
	console.log("⚠️  MongoDB disconnected");
	// Auto-reconnect with exponential backoff
	let retryDelay = 5000;
	const reconnect = () => {
		connectDB()
			.then(() => {
				dbReady = true;
				console.log("♻️ MongoDB reconnected");
			})
			.catch((err) => {
				console.error(
					`Reconnection failed (retrying in ${retryDelay / 1000}s):`,
					err.message
				);
				setTimeout(reconnect, retryDelay);
				retryDelay = Math.min(retryDelay * 2, 30000); // Cap at 30s
			});
	};
	setTimeout(reconnect, retryDelay);
});

// Graceful shutdown with cleanup
const shutdown = async () => {
	try {
		console.log("\n🛑 Shutting down server...");

		const { rmSync } = await import("fs");
		const tempDir = path.join(__dirname, "tmp");
		try {
			rmSync(tempDir, { recursive: true, force: true });
			console.log("🧹 Cleaned up temporary files");
		} catch (cleanupError) {
			console.log("⚠️ Temp directory cleanup skipped:", cleanupError.message);
		}

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

// Start the server
initializeServer();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	shutdown();
});
