import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    desc: {
      type: String,
      default: "",
      trim: true,
    },
    bgColor: {
      type: String,
      default: "rgba(254, 182, 13, .2)",
    },
    textColor: {
      type: String,
      default: "#FEB60D",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);
