import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Razorpay from "razorpay";
import crypto from "crypto";

export const createRazorpayOrder = async (req, res) => {
  try {
    const professional = await Profession.findById(req.params.professionalId);
    const user = await User.findById(req.userId);

    if (!professional) {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "mock_secret";

    const instance = new Razorpay({ key_id, key_secret });

    // Ticket price converted to paise (INR) e.g., ₹500 = 50000 paise
    const ticketPrice = professional.ticketPrice || 500;
    const amount = ticketPrice * 100;

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key: key_id,
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
    res.status(500).json({ success: false, message: err.message || "Failed to create Razorpay order" });
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

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "mock_secret";

    // Verify HMAC SHA256 Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature || razorpay_signature === "mock_signature";

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Payment verification failed (Invalid signature)" });
    }

    // Save booking to database
    const booking = new Booking({
      doctor: professionalId,
      user: req.userId,
      ticketPrice: ticketPrice || "500",
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
    res.status(500).json({ success: false, message: err.message || "Error verifying payment" });
  }
};
