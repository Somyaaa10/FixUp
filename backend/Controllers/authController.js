import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  const { email, password, name, profession, photo, gender, role } = req.body; // Added role here
  try {
    if (!["customer", "professional"].includes(role)) {
      return res.status(400).json({ message: "A valid role is required" });
    }

    let user = null;

    if (role === "customer") {
      user = await User.findOne({ email });
    } else if (role === "professional") {
      user = await Profession.findOne({ email });
    }

    // Check if the user already exists
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    if (role === "customer") {
      user = new User({
        name,
        email,
        password: hashPassword,
        photo,
        gender,
        role,
      });
    } else if (role === "professional") {
      user = new Profession({
        name,
        email,
        password: hashPassword,
        photo,
        gender,
        role,
      });
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Account created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error, please try again",
      });
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body; // Added role here
  try {
    if (!["customer", "professional"].includes(role)) {
      return res.status(400).json({ message: "A valid role is required" });
    }

    let user = null;

    if (role === "customer") {
      user = await User.findOne({ email });
    } else if (role === "professional") {
      user = await Profession.findOne({ email });
    }

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fixup_secret_key_12345", {
      expiresIn: "15d",
    });

    const { password: userPassword, ...rest } = user._doc;

    res.status(200).json({
      status: true,
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
