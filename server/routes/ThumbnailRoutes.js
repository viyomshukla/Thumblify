import express from "express";
import { generateThumbnail, deleteThumbnail } from "../controllers/thumbnailController.js";
import multer from "multer";
import { uploadFrame } from '../controllers/uploadFrameController.js';

// ✅ FIXED: Use memoryStorage so req.file.buffer is available in the controller
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ThumbnailRouter = express.Router();

// Logging middleware
ThumbnailRouter.use((req, res, next) => {
  console.log("🔥 THUMBNAIL ROUTER HIT:", req.method, req.url);
  next();
});

ThumbnailRouter.get("/test", (req, res) => {
    console.log("✅ TEST ROUTE EXECUTED");
    res.json({ message: "Thumbnail router is working!" });
});

// Route for generation
// Note: Ensure the frontend is sending the file under the field name 'image'
ThumbnailRouter.post("/generate", upload.single('image'), generateThumbnail);

ThumbnailRouter.delete("/delete/:id", deleteThumbnail);
ThumbnailRouter.post("/upload-frame", uploadFrame);

export default ThumbnailRouter;