import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
	mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "text/csv" ||
		file.mimetype === "application/vnd.ms-excel" ||
		file.originalname.endsWith(".csv")
	) {
		cb(null, true);
	} else {
		cb(new Error("Only CSV files are allowed"), false);
	}
};

export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB limit
	},
});

export const handleMulterErrors = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		return res.status(400).json({
			success: false,
			message:
				err.code === "LIMIT_FILE_SIZE"
					? "File too large (max 100MB)"
					: "File upload error",
		});
	} else if (err) {
		return res.status(400).json({
			success: false,
			message: err.message || "File upload failed",
		});
	}
	next();
};
