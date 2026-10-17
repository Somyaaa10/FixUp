import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profession",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    serviceName: {
      type: String,
      trim: true,
      default: "Home Service",
    },

    ticketPrice: {
      type: String,
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
      default: "09:00 AM - 11:00 AM",
      trim: true,
    },

    serviceAddress: {
      type: String,
      required: true,
      default: "Customer Service Address",
      trim: true,
    },

    customerNotes: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to accelerate availability and conflict queries
bookingSchema.index({ professional: 1, appointmentDate: 1, timeSlot: 1 });

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
