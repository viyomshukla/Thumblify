import express from "express";
import { getUserThumbnails, getThumbnailById, getUserCredits } from "../controllers/UserController.js";

const UserRouter = express.Router();

UserRouter.get("/thumbnails", getUserThumbnails);
UserRouter.get("/thumbnails/:id", getThumbnailById);
UserRouter.get("/credits", getUserCredits);

export default UserRouter;

