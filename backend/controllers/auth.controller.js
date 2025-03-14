import { generateTokenAndSetCookie } from '../lib/utils/generateToken.js';
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Check for existing username
        const existingUser = await User.findOne({ username }); // Because we have the same value for name we only use username instead of username:username
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" }); // Fixed consistency
        }

        // Check for existing email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email already exists" }); // Fixed capitalization
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }


        // Password hashing
        const salt = await bcrypt.genSalt(10); // Fixed typo: getSalt → genSalt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user instance
        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        // Save user to database FIRST
        await newUser.save(); // Moved before token generation

        // Generate JWT token after successful save
        generateTokenAndSetCookie(newUser._id, res);

        // Send response with user data (excluding sensitive information)
        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            username: newUser.username,
            email: newUser.email,
            followers: newUser.followers,
            following: newUser.following,
            profileImg: newUser.profileImg,
            coverImg: newUser.coverImg,
        });

    } catch (error) {
        console.error("Error in signup controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });

        // Safely compare passwords (even if user doesn't exist)
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user?.password || "" // Prevent null reference
        );

        // Combined security check
        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Set secure HTTP-only cookie
        generateTokenAndSetCookie(user._id, res);

        // Return user data (excluding sensitive info)
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear JWT cookie immediately
        res.cookie("jwt", "", {
            maxAge: 0, // Instant expiration
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMe = async (req, res) => {
    try {
        // Get current user from auth middleware
        const user = await User.findById(req.user._id)
            .select("-password") // Exclude password field
            .lean(); // Return plain JS object

        res.status(200).json(user);
    } catch (error) {
        console.error("GetMe error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};