import mongoose from "mongoose";

const paymentOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profession",
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    amount: {
      type: Number,
      required: true, // in paise
    },
    currency: {
      type: String,
      default: "INR",
    },
    receipt: {
      type: String,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    paymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentOrder ||
  mongoose.model("PaymentOrder", paymentOrderSchema);
