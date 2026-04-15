import express from "express";
import { generateThumbnail, deleteThumbnail, saveThumbnail } from "../controllers/thumbnailController.js";
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

// Route for generation (3 models in parallel)
ThumbnailRouter.post("/generate", upload.single('image'), generateThumbnail);

// Route for saving a preview as favorite
ThumbnailRouter.post("/save", saveThumbnail);

ThumbnailRouter.delete("/delete/:id", deleteThumbnail);
ThumbnailRouter.post("/upload-frame", uploadFrame);

export default ThumbnailRouter;