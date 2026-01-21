import Thumbnail from "../model/thumbnail.js";
import User from "../model/user.js"; // ✅ Add this import
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
    'Bold & Graphic': 'professional YouTube thumbnail, shocked facial expression, bold typography, vibrant colors, dramatic lighting, high contrast, attention-grabbing, trending style',
    'Tech/Futuristic': 'futuristic tech YouTube thumbnail, holographic UI, neon glow, digital particles, sleek modern design, sci-fi aesthetic, 8K quality',
    'Minimalist': 'minimalist YouTube thumbnail, clean layout, simple shapes, limited colors, modern flat design, professional typography',
    'Photorealistic': 'photorealistic YouTube thumbnail, DSLR photography, studio lighting, sharp focus, professional portrait, cinematic',
    'Illustrated': 'digital illustration YouTube thumbnail, bold outlines, vibrant colors, cartoon style, expressive characters, dynamic composition',
};

const colorSchemeDescriptions = {
    vibrant: 'vibrant energetic colors, high saturation, bold',
    sunset: 'warm sunset orange pink purple gradient',
    forest: 'natural green earthy forest tones',
    neon: 'neon glow, electric cyan and magenta',
    purple: 'purple magenta violet gradient',
    monochrome: 'black and white, high contrast',
    ocean: 'cool blue and teal ocean tones',
    pastel: 'soft pastel colors, gentle tones',
};

export const generateThumbnail = async (req, res) => {
    let thumbnail = null;
    let uploadedReferenceImageUrl = null;
    
    try {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const { userId } = req.session;
        const { 
            title, 
            prompt: userPrompt, 
            color_scheme, 
            aspectRatio, 
            style, 
            text_overlay, 
            additionalDetails,
            model // ✅ Get model from request (basic or premium)
        } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // ✅ CHECK USER CREDITS
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Determine credit cost based on model
        const creditCost = model === 'premium' ? 10 : 5;

        // ✅ Check if user has enough credits
        if (user.credits < creditCost) {
            return res.status(400).json({ 
                message: "Insufficient credits",
                required: creditCost,
                available: user.credits
            });
        }

        console.log('🚀 Starting thumbnail generation...');
        console.log('📝 Title:', title);
        console.log('💳 Model:', model, '- Cost:', creditCost, 'credits');
        console.log('💰 User Credits Before:', user.credits);

        // Handle uploaded reference image if exists
        if (req.file) {
            console.log('📸 Reference image uploaded:', req.file.originalname);
            
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            
            const referenceUpload = await cloudinary.uploader.upload(base64Image, {
                folder: 'reference_images',
                resource_type: 'image',
            });
            
            uploadedReferenceImageUrl = referenceUpload.secure_url;
            console.log('✅ Reference image uploaded to Cloudinary:', uploadedReferenceImageUrl);
        }

        // Create thumbnail record
        thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used: userPrompt,
            user_prompt: userPrompt,
            description: additionalDetails,
            color_scheme: color_scheme || 'vibrant',
            aspect_ratio: aspectRatio || '16:9',
            style: style || 'Bold & Graphic',
            text_overlay: text_overlay || false,
            reference_image_url: uploadedReferenceImageUrl,
            isGenerating: true,
        });

        // Build detailed prompt
       const stylePrompt = stylePrompts[style] || stylePrompts['Bold & Graphic'];
        const colorDesc = colorSchemeDescriptions[color_scheme] || colorSchemeDescriptions.vibrant;

        // "Language Anchors" force the AI to use English characters (Latin alphabet)
        const languageSafeguard = ", English text only, written in Latin alphabet, clear readable letters, high-quality typography, professional spelling, no foreign characters, no gibberish";

        let imagePrompt = `${stylePrompt}, ${colorDesc}, professional YouTube thumbnail for "${title}"`;
        
        if (text_overlay) {
            // Using quotation marks around the text helps the AI identify it as literal text
            imagePrompt += `, large bold high-contrast text overlay reading exactly "${title}"${languageSafeguard}`;
        }
        
        if (uploadedReferenceImageUrl) {
            imagePrompt += `, incorporating elements from the reference image, matching the style and composition`;
        }
        
        if (additionalDetails) {
            imagePrompt += `, ${additionalDetails}`;
        }
        
        if (userPrompt) {
            imagePrompt += `, ${userPrompt}`;
        }
        
        // Add quality tags
        imagePrompt += model === 'premium' 
            ? ', ultra high quality, 8K, masterpiece, highly detailed, sharp edges' 
            : ', professional quality, eye-catching, detailed';

        console.log('📝 Safeguarded Image Prompt:', imagePrompt);

        // 2. DIMENSIONS & URL BUILDING
        let width = 1792;
        let height = 1024;
        if (aspectRatio === '1:1') { width = 1024; height = 1024; }
        else if (aspectRatio === '9:16') { width = 1024; height = 1792; }

        // Added 'enhance=true' and 'model=flux' which is much better at English text
        let pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Date.now()}`;
        
        if (uploadedReferenceImageUrl) {
            pollinationsUrl += `&reference=${encodeURIComponent(uploadedReferenceImageUrl)}`;
        }

        // Build Pollinations.ai URL

        
        console.log('✅ Generation URL created');
        console.log('📤 Uploading to Cloudinary...');

        // Upload generated thumbnail to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(pollinationsUrl, {
            folder: 'thumbnails',
            public_id: `thumb_${thumbnail._id}`,
            resource_type: 'image',
            overwrite: true,
        });
        
        console.log('✅ Uploaded to Cloudinary successfully!');

        // ✅ DEDUCT CREDITS FROM USER
        user.credits -= creditCost;
        await user.save();
        
        console.log('💰 User Credits After:', user.credits);
        console.log('✅ Credits deducted successfully!');

        // Update thumbnail with final data
        thumbnail.image_url = cloudinaryResult.secure_url;
        thumbnail.prompt_used = imagePrompt;
        thumbnail.isGenerating = false;
        await thumbnail.save();

        console.log('✅ Thumbnail generation complete!');
        console.log('🖼️ Final Thumbnail URL:', cloudinaryResult.secure_url);

        // Send response after everything is done
        res.status(201).json({ 
            message: "Thumbnail generated successfully", 
            thumbnail,
            creditsRemaining: user.credits // ✅ Return remaining credits
        });

    } catch (error) {
        console.error("❌ Generate thumbnail error:", error);
        console.error("Error details:", error.message);
        
        if (thumbnail) {
            thumbnail.isGenerating = false;
            await thumbnail.save();
        }
        
        if (!res.headersSent) {
            return res.status(500).json({ 
                message: "Failed to generate thumbnail", 
                error: error.message 
            });
        }
    }
};

export const deleteThumbnail = async (req, res) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const { userId } = req.session;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const thumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId });
        if (!thumbnail) {
            return res.status(404).json({ success: false, message: "Thumbnail not found" });
        }

        if (thumbnail.image_url) {
            const publicId = `thumbnails/thumb_${id}`;
            await cloudinary.uploader.destroy(publicId).catch(err => {
                console.log('Cloudinary delete warning:', err.message);
            });
        }

        if (thumbnail.reference_image_url) {
            const urlParts = thumbnail.reference_image_url.split('/');
            const publicIdWithExt = urlParts.slice(-2).join('/');
            const publicId = publicIdWithExt.split('.')[0];
            
            await cloudinary.uploader.destroy(publicId).catch(err => {
                console.log('Reference image delete warning:', err.message);
            });
        }

        res.status(200).json({ success: true, message: "Thumbnail deleted successfully" });
    } catch (error) {
        console.error("Delete thumbnail error:", error);
        res.status(500).json({ success: false, message: "Failed to delete thumbnail" });
    }
};