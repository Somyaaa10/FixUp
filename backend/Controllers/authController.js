import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  const { email, password, name, profession, photo, gender, role } = req.body;
  try {
    if (!["customer", "professional"].includes(role)) {
      return res.status(400).json({ success: false, message: "A valid role is required" });
    }

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if the email already exists across BOTH User and Profession collections
    const [existingUser, existingProf] = await Promise.all([
      User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }),
      Profession.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }),
    ]);

    if (existingUser || existingProf) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    let user = null;

    if (role === "customer") {
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashPassword,
        photo,
        gender,
        role,
      });
    } else if (role === "professional") {
      user = new Profession({
        name: name.trim(),
        email: normalizedEmail,
        password: hashPassword,
        photo,
        gender,
        role,
        isApproved: "pending",
        isActive: true,
      });
    }

    await user.save();

    // Concurrency safety check: detect race conditions where another role registered concurrently
    const opposingRecord =
      role === "customer"
        ? await Profession.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } })
        : await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } });

    if (opposingRecord) {
      // Rollback current user creation to prevent duplicate email across collections
      if (role === "customer") {
        await User.findByIdAndDelete(user._id);
      } else {
        await Profession.findByIdAndDelete(user._id);
      }
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    res
      .status(200)
      .json({ success: true, message: "Account created successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error, please try again",
      });
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    if (!["customer", "professional", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "A valid role is required" });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${normalizedEmail}$`, "i");
    let user = null;

    if (role === "customer" || role === "admin") {
      user = await User.findOne({ email: { $regex: emailRegex } });
      // Fallback check if user is registered as professional
      if (!user) {
        user = await Profession.findOne({ email: { $regex: emailRegex } });
      }
    } else if (role === "professional") {
      user = await Profession.findOne({ email: { $regex: emailRegex } });
      // Fallback check if user is registered in User collection
      if (!user) {
        user = await User.findOne({ email: { $regex: emailRegex } });
      }
    }

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is missing on server");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret key missing",
      });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    const { password: userPassword, ...rest } = user._doc;

    res.status(200).json({
      status: true,
      success: true,
      message: "Successfully logged in",
      token,
      data: { ...rest },
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error, please try again",
      });
  }
};
