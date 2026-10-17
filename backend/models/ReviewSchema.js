import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Types.ObjectId,
      ref: "Profession",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    booking: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
    reviewText: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for the same booking while keeping backward compatibility
reviewSchema.index({ booking: 1 }, { unique: true, sparse: true });

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
