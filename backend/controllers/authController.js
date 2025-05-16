const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret key - in production this should be an environment variable
const JWT_SECRET = 'your-secret-key-change-this-in-production';

const signup = async (req, res) => {
    console.log("Request Body:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Create a new user
        const newUser = new User({ name, email, password });
        await newUser.save();
        
        console.log("Signup successful for:", name);
        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const login = async (req, res) => {
    console.log("Request Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists and password matches
        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        
        // Update user status to online
        user.status = 'online';
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log("Login successful for:", email);
        res.status(200).json({ 
            success: true, 
            message: "Login successful", 
            username: user.name,
            token: token 
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const logout = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    try {
        // Find the user and update status to offline
        const user = await User.findOne({ email });
        if (user) {
            user.status = 'offline';
            await user.save();
            console.log("Logout successful for:", email);
        }
        
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all users and their status
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, status: 1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { signup, login, logout, getAllUsers };