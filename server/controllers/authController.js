import bcrypt from "bcryptjs";
import User from "../model/user.js";

export const registerUser = async(req, res) => {
    try {
        const {name, email, password} = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({message: "Please provide name, email, and password"});
        }
        
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: "User already exists"});
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({name, email, password: hashedPassword, credits: 30});
        
        req.session.isLoggedIn = true;
        req.session.userId = user._id;
        
        res.status(201).json({message: "User created successfully", user});
    } catch(error) {
        console.error("Register error:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({message: "User already exists with this email"});
        }
        
        return res.status(500).json({message: "Server error during registration", error: error.message});
    }
}

export const loginUser = async(req, res) => {
    try {
        const {email, password} = req.body;
        
        if (!email || !password) {
            return res.status(400).json({message: "Please provide email and password"});
        }
        
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({message: "Invalid email or password"});
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({message: "Invalid email or password"});
        }
        
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();
        res.status(200).json({message: "Login successful", user});
    } catch(error) {
        console.error("Login error:", error);
        return res.status(500).json({message: "Server error during login", error: error.message});
    }
}

export const logoutUser = async(req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({message: "Logout failed"});
        }
        res.status(200).json({message: "Logout successful"});
    });
}

export const verifyUser = async(req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({message: "Unauthorized"});
        }
        
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(401).json({message: "Unauthorized"});
        }
        
        res.status(200).json({message: "User verified", user});
    } catch(error) {
        console.error("Verify user error:", error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}
