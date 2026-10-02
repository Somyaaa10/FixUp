import express from "express";
import { authenticate } from "../middleware/verifyToken.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../Controllers/bookingController.js";

const router = express.Router();

router.post("/razorpay-order/:professionalId", authenticate, createRazorpayOrder);
router.post("/verify-payment", authenticate, verifyRazorpayPayment);

export default router;
