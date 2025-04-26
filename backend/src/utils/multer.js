// utils/multer.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure 'uploads/' folder exists, create it if not
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir); // Set the destination folder
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + "-" + file.originalname); // Set the file name
	},
});

// Correctly set the file size limit to 100 MB (100 * 1024 * 1024 bytes)
const upload = multer({
	storage: storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // Correct size limit for 100 MB
	fileFilter: (req, file, cb) => {
		// Accept only CSV files
		if (file.mimetype !== "text/csv") {
			return cb(new Error("Invalid file type. Only CSV files are allowed."));
		}
		cb(null, true);
	},
});

// Log the file size limit
console.log("Multer file size limit:", 100 * 1024 * 1024); // Should print 100 MB

export { upload };
