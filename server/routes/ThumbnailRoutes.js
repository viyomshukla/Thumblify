import express from "express";
import { generateThumbnail, deleteThumbnail } from "../controllers/thumbnailController.js";
import multer from "multer";

const upload = multer({ dest: 'uploads/' });

const ThumbnailRouter = express.Router();

// Add logging middleware to THIS router specifically
ThumbnailRouter.use((req, res, next) => {
  console.log("🔥 THUMBNAIL ROUTER HIT:", req.method, req.url);
  next();
});

ThumbnailRouter.get("/test", (req, res) => {
    console.log("✅ TEST ROUTE EXECUTED");
    res.json({ message: "Thumbnail router is working!" });
});

ThumbnailRouter.post("/generate", upload.single('image'), generateThumbnail);
ThumbnailRouter.delete("/delete/:id", deleteThumbnail);

export default ThumbnailRouter;