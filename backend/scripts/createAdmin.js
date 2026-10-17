import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/UserSchema.js";

dotenv.config();

export const seedAdminIfMissing = async (forceReset = false) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@fixup.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Password123!";

    const existingAdmin = await User.findOne({
      email: { $regex: new RegExp(`^${adminEmail}$`, "i") },
    });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(adminPassword, salt);

    if (existingAdmin) {
      if (forceReset) {
        existingAdmin.password = hashPassword;
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log(`Admin account password updated for (${adminEmail})`);
      }
      return;
    }

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
    const forceReset = process.argv.includes("--reset");
    await seedAdminIfMissing(forceReset);
    await mongoose.disconnect();
    console.log("Admin setup finished");
  } catch (err) {
    console.error("Admin setup script failed:", err);
  }
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  runStandaloneScript();
}
