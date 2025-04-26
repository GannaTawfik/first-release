import express from "express";
import multer from "multer";
import { uploadAndCleanCSV } from "./fileUpload.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload_csv", upload.single("file"), uploadAndCleanCSV);

export default router;
