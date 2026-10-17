import express from "express";
import { authenticate, restrict } from "../middleware/verifyToken.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getProfessionalAvailability,
  cancelCustomerBooking,
} from "../Controllers/bookingController.js";

const router = express.Router();

router.get("/availability/:professionalId", getProfessionalAvailability);
router.post("/razorpay-order/:professionalId", authenticate, createRazorpayOrder);
router.post("/verify-payment", authenticate, verifyRazorpayPayment);
router.patch("/:id/cancel", authenticate, restrict(["customer"]), cancelCustomerBooking);

export default router;
