import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: Number },
  photo: { type: String },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  gender: { type: String, enum: ["male", "female", "others"] },
  bloodType: { type: String },
  isActive: { type: Boolean, default: true },
  appointments: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
