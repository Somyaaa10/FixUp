
import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Razorpay from "razorpay";
import crypto from "crypto";

export const createRazorpayOrder = async (req, res) => {
  try {
    const professional = await Profession.findById(
      req.params.professionalId
    );

    const user = await User.findById(req.userId);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Ticket price converted to paise
    // Example: ₹500 = 50000 paise
    const ticketPrice = professional.ticketPrice || 500;
    const amount = ticketPrice * 100;

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()} `,
    };

    const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      professional: {
        id: professional._id,
        name: professional.name,
        specialization: professional.specialization,
      },
      user: {
        name: user?.name,
        email: user?.email,
      },
    });
  } catch (err) {
    console.error("Razorpay Order Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to create Razorpay order",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      professionalId,
      ticketPrice,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !professionalId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment information",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    // Verify Razorpay HMAC SHA256 signature
    const body = `${razorpay_order_id}| ${razorpay_payment_id} `;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed (Invalid signature)",
      });
    }

    const professional = await Profession.findById(professionalId);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    // Save booking after successful payment verification
    const booking = new Booking({
      professional: professionalId,
      user: req.userId,
      ticketPrice: ticketPrice || String(professional.ticketPrice || 500),
      appointmentDate: new Date(),
      status: "approved",
      isPaid: true,
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment verified & booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("Razorpay Verification Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Error verifying payment",
    });
  }
};
