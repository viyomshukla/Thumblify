import Thumbnail from "../model/thumbnail.js";
import User from "../model/user.js";
export const getUserThumbnails = async (req, res) => {
    try {
        const {userId} = req.session;
        if (!userId) {
            return res.status(401).json({message:"Unauthorized"});
        }
        const thumbnails = await Thumbnail.find({userId}).sort({createdAt: -1});
        res.status(200).json({message:"Thumbnails fetched successfully", thumbnails});
    } catch(error) {
        console.error("Get thumbnails error:", error);
        return res.status(500).json({message:"Internal server error", error: error.message});
    }
}

export const getThumbnailById = async (req, res) => {
    try {
        const {userId} = req.session;
        if (!userId) {
            return res.status(401).json({message:"Unauthorized"});
        }
        const {id} = req.params;
        const thumbnail = await Thumbnail.findOne({_id: id, userId});
        if (!thumbnail) {
            return res.status(404).json({message:"Thumbnail not found"});
        }
        res.status(200).json({message:"Thumbnail fetched successfully", thumbnail});
    } catch(error) {
        console.error("Get thumbnail by ID error:", error);
        return res.status(500).json({message:"Internal server error", error: error.message});
    }
}

export const getUserCredits = async (req, res) => {
    try {
        const {userId} = req.session;
        if (!userId) {
            return res.status(401).json({message:"Unauthorized"});
        }
        const user = await User.findById(userId).select("credits plan");
        if (!user) {
            return res.status(404).json({message:"User not found"});
        }
        res.status(200).json({credits: user.credits, plan: user.plan});
    } catch(error) {
        console.error("Get user credits error:", error);
        return res.status(500).json({message:"Internal server error", error: error.message});
    }
}
