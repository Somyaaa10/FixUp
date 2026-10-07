import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/UserSchema.js";

dotenv.config();

export const seedAdminIfMissing = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@fixup.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      name: "FixUp System Admin",
      email: adminEmail,
      password: hashPassword,
      role: "admin",
      gender: "others",
    });

    await adminUser.save();
    console.log(`Admin user created successfully (${adminEmail})`);
  } catch (error) {
    console.error("Error creating admin account:", error.message);
  }
};

const runStandaloneScript = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup");
    console.log("Connected to MongoDB for admin setup");
    await seedAdminIfMissing();
    await mongoose.disconnect();
    console.log("Admin setup finished");
  } catch (err) {
    console.error("Admin setup script failed:", err);
  }
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  runStandaloneScript();
}
