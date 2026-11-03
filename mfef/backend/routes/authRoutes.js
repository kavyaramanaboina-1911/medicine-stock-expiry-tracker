
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../Models/Admin");

const router = express.Router();

// Admin Login API
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find admin in MongoDB
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        message: "Admin email not found"
      });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password"
      });
    }

    // Generate login token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

module.exports = router;
