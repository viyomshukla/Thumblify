import mongoose from "mongoose";

const ThumbnailSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    style: {
      type: String,
      enum: [
        "Bold & Graphic",
        "Tech/Futuristic",
        "Minimalist",
        "Photorealistic",
        "Illustrated",
        "Extension Capture",
      ],
      default: "Bold & Graphic",
    },
    aspect_ratio: {
      enum: ["16:9", "1:1", "9:16"],
      type: String,
      default: "16:9",
    },
    color_scheme: {
      type: String,
      enum: [
        "vibrant",
        "sunset",
        "forest",
        "neon",
        "purple",
        "monochrome",
        "ocean",
        "pastel",
      ],
      default: "vibrant",
    },
    text_overlay: {
      type: Boolean,
      default: false,
    },
    image_url: {
      type: String,
      default: null,
    },
    prompt_used: {
      type: String,
    },
    user_prompt: {
      type: String,
    },
    isGenerating: {
      type: Boolean,
      default: true,
    },
    original_youtube_url: {
      type: String,
      default: null,
    },
    original_thumbnail_url: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const Thumbnail = mongoose.model("Thumbnail", ThumbnailSchema);

export default Thumbnail;
