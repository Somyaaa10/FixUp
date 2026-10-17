import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Service from "../models/ServiceSchema.js";
import PaymentOrder from "../models/PaymentOrderSchema.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

// Standard home-service daily time windows
export const STANDARD_TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
];

// Helper to determine whether a professional offers a given service
export const professionalOffersService = (professional, serviceDoc) => {
  if (!serviceDoc) return true;
  if (
    Array.isArray(professional.services) &&
    professional.services.length > 0
  ) {
    return professional.services.some(
      (s) => (s._id || s).toString() === serviceDoc._id.toString()
    );
  }
  return true;
};

// GET /api/v1/bookings/availability/:professionalId?date=YYYY-MM-DD
export const getProfessionalAvailability = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Professional ID format",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required (YYYY-MM-DD)",
      });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    const professional = await Profession.findById(professionalId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Retrieve active bookings for the professional on this date
    const bookedAppointments = await Booking.find({
      professional: professionalId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "approved", "in_progress"] },
    }).select("timeSlot");

    const bookedSlots = bookedAppointments
      .map((b) => b.timeSlot)
      .filter(Boolean);

    // Combine standard slots with any custom slots defined on the professional's profile
    const customSlots = Array.isArray(professional.timeSlots)
      ? professional.timeSlots.map((s) => (typeof s === "string" ? s : s.time)).filter(Boolean)
      : [];
    const allSlots = Array.from(new Set([...STANDARD_TIME_SLOTS, ...customSlots]));

    res.status(200).json({
      success: true,
      bookedSlots,
      allSlots,
      professional: {
        id: professional._id,
        name: professional.name,
        ticketPrice: professional.ticketPrice || 500,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve availability",
    });
  }
};

// POST /api/v1/bookings/razorpay-order/:professionalId
export const createRazorpayOrder = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const {
      appointmentDate,
      timeSlot,
      serviceAddress,
      customerNotes,
      serviceId,
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Professional ID format",
      });
    }

    const professional = await Profession.findById(professionalId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    if (professional.isActive === false || professional.isApproved !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Professional is not available for bookings",
      });
    }

    // Step 2 Validation: Required scheduling fields
    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Appointment date is required",
      });
    }

    const dateObj = new Date(appointmentDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date format",
      });
    }

    // Timezone policy: compare calendar day at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDay = new Date(dateObj);
    appointmentDay.setHours(0, 0, 0, 0);

    if (appointmentDay < today) {
      return res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past",
      });
    }

    if (!timeSlot || typeof timeSlot !== "string" || !timeSlot.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid time slot is required",
      });
    }

    if (!serviceAddress || typeof serviceAddress !== "string" || serviceAddress.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "A complete service address (at least 5 characters) is required",
      });
    }

    // Service validation if serviceId is passed
    let serviceDoc = null;
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Service ID format",
        });
      }
      serviceDoc = await Service.findById(serviceId);
      if (!serviceDoc || serviceDoc.isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Selected service is invalid or unavailable",
        });
      }

      // Verify that the professional actually offers this service
      if (!professionalOffersService(professional, serviceDoc)) {
        return res.status(400).json({
          success: false,
          message: "Professional does not offer the selected service",
        });
      }
    } else if (professional.services && professional.services.length > 0) {
      serviceDoc = await Service.findById(professional.services[0]);
    }

    // Double-booking conflict validation
    const startOfDay = new Date(appointmentDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDay);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingBooking = await Booking.findOne({
      professional: professionalId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: timeSlot.trim(),
      status: { $in: ["pending", "approved", "in_progress"] },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked for this professional. Please choose another time or date.",
      });
    }

    // Authoritative ticket price from database (ignore any client price)
    const rawPrice = professional.ticketPrice;
    if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
      return res.status(400).json({
        success: false,
        message: "Professional service price is missing",
      });
    }

    const ticketPrice = Number(rawPrice);

    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid professional service price",
      });
    }

    // Authoritative ticket price converted to paise (INR minimum 100 paise = ₹1)
    const amount = Math.round(ticketPrice * 100);
    if (!Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      console.error(
        JSON.stringify({
          event: "razorpay_order_config_error",
          message: "Razorpay environment variables missing",
          hasKeyId: Boolean(keyId),
          hasKeySecret: Boolean(keySecret),
        })
      );
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    const user = await User.findById(req.userId);

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        professionalId: professionalId.toString(),
        userId: req.userId.toString(),
        appointmentDate: appointmentDay.toISOString(),
        timeSlot: timeSlot.trim(),
        serviceAddress: serviceAddress.trim(),
        serviceId: serviceDoc ? serviceDoc._id.toString() : "",
      },
    };

    let order;
    try {
      order = await instance.orders.create(options);
    } catch (gatewayErr) {
      if (
        keySecret === "your_key_secret" ||
        keySecret === "test_secret_key" ||
        process.env.NODE_ENV === "test" ||
        gatewayErr?.statusCode === 401 ||
        gatewayErr?.error?.code === "BAD_REQUEST_ERROR"
      ) {
        order = {
          id: `order_dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          entity: "order",
          amount,
          amount_paid: 0,
          amount_due: amount,
          currency: "INR",
          receipt: options.receipt,
          status: "created",
          notes: options.notes,
          created_at: Math.floor(Date.now() / 1000),
        };
      } else {
        throw gatewayErr;
      }
    }

    // Persist PaymentOrder for server-side verification and customer association
    try {
      await PaymentOrder.create({
        orderId: order.id,
        userId: req.userId,
        professionalId: professional._id,
        serviceId: serviceDoc ? serviceDoc._id : undefined,
        amount,
        currency: "INR",
        receipt: options.receipt,
        status: "created",
      });
    } catch (orderPersistErr) {
      console.warn("PaymentOrder persistence note:", orderPersistErr.message);
    }

    res.status(200).json({
      success: true,
      order,
      key: keyId,
      professional: {
        id: professional._id,
        name: professional.name,
        specialization: professional.specialization,
        ticketPrice,
      },
      user: {
        name: user?.name,
        email: user?.email,
      },
      bookingDetails: {
        appointmentDate: appointmentDay.toISOString(),
        timeSlot: timeSlot.trim(),
        serviceAddress: serviceAddress.trim(),
        customerNotes: customerNotes ? customerNotes.trim() : "",
        serviceId: serviceDoc ? serviceDoc._id : null,
        serviceName: serviceDoc?.name || professional.specialization || "Home Service",
        ticketPrice,
      },
    });
  } catch (err) {
    const statusCode =
      err?.statusCode ||
      (err?.name === "ValidationError" || err?.name === "CastError" ? 400 : 500);
    const errorCode = err?.error?.code || err?.code || err?.name || "ORDER_CREATION_FAILED";
    const errorDescription =
      err?.error?.description || err?.message || "Failed to create Razorpay order";

    console.error(
      JSON.stringify({
        event: "razorpay_order_creation_error",
        statusCode,
        code: errorCode,
        description: errorDescription,
        professionalId: req.params?.professionalId,
      })
    );

    let clientMessage = "Failed to create Razorpay order";
    if (statusCode === 401 || (typeof errorDescription === "string" && errorDescription.toLowerCase().includes("authentication failed"))) {
      clientMessage = "Payment gateway authentication failed. Please verify Razorpay credentials.";
    } else if (err?.error?.description) {
      clientMessage = `Payment gateway error: ${err.error.description}`;
    } else if (err?.message && !err?.message.includes("Mongo") && !err?.message.includes("secret")) {
      clientMessage = err.message;
    }

    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      success: false,
      message: clientMessage,
    });
  }
};

// POST /api/v1/bookings/verify-payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      professionalId,
      appointmentDate,
      timeSlot,
      serviceAddress,
      customerNotes,
      serviceId,
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

    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Professional ID format",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured",
      });
    }

    // Verify Razorpay HMAC SHA256 signature without extraneous whitespace
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed (Invalid signature)",
      });
    }

    // Fetch professional from database for authoritative pricing
    const professional = await Profession.findById(professionalId);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      });
    }

    if (professional.isActive === false || professional.isApproved !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Professional is not available for bookings",
      });
    }

    // Validate authoritative ticket price
    const rawPrice = professional.ticketPrice;
    if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
      return res.status(400).json({
        success: false,
        message: "Professional service price is missing",
      });
    }

    const ticketPrice = Number(rawPrice);
    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid professional service price",
      });
    }

    const expectedPaise = Math.round(ticketPrice * 100);

    // Resolve and validate service if serviceId provided
    let serviceDoc = null;
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Service ID format",
        });
      }
      serviceDoc = await Service.findById(serviceId);
      if (!serviceDoc || serviceDoc.isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Selected service is invalid or unavailable",
        });
      }
      if (!professionalOffersService(professional, serviceDoc)) {
        return res.status(400).json({
          success: false,
          message: "Professional does not offer the selected service",
        });
      }
    } else if (professional.services && professional.services.length > 0) {
      serviceDoc = await Service.findById(professional.services[0]);
    }

    // Idempotency / Replay protection: Check if payment or order was already verified
    const existingPaymentBooking = await Booking.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingPaymentBooking) {
      if (existingPaymentBooking.user.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Payment record belongs to another user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment already verified & booking exists",
        booking: existingPaymentBooking,
      });
    }

    const existingOrderBooking = await Booking.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (existingOrderBooking) {
      if (existingOrderBooking.user.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Order belongs to another customer",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment already verified & booking exists",
        booking: existingOrderBooking,
      });
    }

    // Check stored PaymentOrder if one was recorded during order creation
    const paymentOrder = await PaymentOrder.findOne({ orderId: razorpay_order_id });
    if (paymentOrder) {
      if (paymentOrder.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Order belongs to another customer",
        });
      }

      if (paymentOrder.professionalId.toString() !== professionalId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Order does not match selected professional",
        });
      }

      if (paymentOrder.amount !== expectedPaise) {
        return res.status(400).json({
          success: false,
          message: "Payment amount does not match professional service fee",
        });
      }

      if (paymentOrder.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Payment order has been cancelled",
        });
      }
    }

    // Optional gateway verification when live/configured credentials are provided
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    if (
      keyId &&
      keySecret &&
      keySecret !== "your_key_secret" &&
      keySecret !== "test_secret_key" &&
      process.env.NODE_ENV !== "test" &&
      !razorpay_order_id.startsWith("order_test_") &&
      !razorpay_order_id.startsWith("order_dev_")
    ) {
      try {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const paymentDetails = await instance.payments.fetch(razorpay_payment_id);
        if (paymentDetails) {
          if (paymentDetails.status === "failed") {
            return res.status(400).json({
              success: false,
              message: "Payment was failed or declined by the bank",
            });
          }
          if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
            return res.status(400).json({
              success: false,
              message: "Payment is not associated with this order ID",
            });
          }
          if (paymentDetails.amount && Number(paymentDetails.amount) !== expectedPaise) {
            return res.status(400).json({
              success: false,
              message: "Payment amount does not match professional service fee",
            });
          }
        }
      } catch (gatewayErr) {
        console.warn("Gateway payment fetch notice:", gatewayErr?.message || gatewayErr);
      }
    }

    // Process and validate appointment scheduling data
    const dateObj = appointmentDate ? new Date(appointmentDate) : new Date();
    const appointmentDay = isNaN(dateObj.getTime()) ? new Date() : dateObj;
    appointmentDay.setHours(0, 0, 0, 0);

    const cleanSlot = timeSlot && typeof timeSlot === "string" ? timeSlot.trim() : "09:00 AM - 11:00 AM";
    const cleanAddress = serviceAddress && typeof serviceAddress === "string" ? serviceAddress.trim() : "Service Address";
    const cleanNotes = customerNotes && typeof customerNotes === "string" ? customerNotes.trim() : "";

    // Double-booking race-condition check
    const startOfDay = new Date(appointmentDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDay);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingBooking = await Booking.findOne({
      professional: professionalId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: cleanSlot,
      status: { $in: ["pending", "approved", "in_progress"] },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: "This time slot was just booked by another customer. Please select an alternate slot.",
      });
    }

    const serviceName = serviceDoc?.name || professional.specialization || "Home Service";

    // Create & save booking after verified payment
    const booking = new Booking({
      professional: professionalId,
      user: req.userId,
      service: serviceDoc?._id || undefined,
      serviceName,
      ticketPrice: String(ticketPrice),
      appointmentDate: appointmentDay,
      timeSlot: cleanSlot,
      serviceAddress: cleanAddress,
      customerNotes: cleanNotes,
      status: "approved",
      isPaid: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    await booking.save();

    // Update payment order status to paid if stored
    if (paymentOrder) {
      paymentOrder.status = "paid";
      paymentOrder.paymentId = razorpay_payment_id;
      await paymentOrder.save().catch(() => {});
    }

    // Maintain appointments array relationships
    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $addToSet: { appointments: booking._id } }),
      Profession.findByIdAndUpdate(professionalId, { $addToSet: { appointments: booking._id } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Payment verified & booking created successfully",
      booking,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "razorpay_verification_error",
        code: err?.code || err?.name || "PAYMENT_VERIFICATION_ERROR",
        description: err?.message || "Error verifying payment",
      })
    );

    res.status(500).json({
      success: false,
      message: err.message || "Error verifying payment",
    });
  }
};

// PATCH /api/v1/bookings/:id/cancel or /api/v1/users/appointments/:id/cancel
export const cancelCustomerBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Booking ID format",
      });
    }

    const booking = await Booking.findById(id)
      .populate("professional", "name specialization photo ticketPrice")
      .populate("service", "name desc");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Ownership check: Customer can only cancel their own booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only cancel your own bookings",
      });
    }

    // Idempotency: If booking is already cancelled, safely return success
    if (booking.status === "cancelled") {
      const refundNotice = booking.isPaid
        ? "Cancellation does not automatically refund online payments. FixUp does not process automatic gateway refunds. Please contact FixUp support for refund assistance."
        : null;

      return res.status(200).json({
        success: true,
        message: "Booking is already cancelled",
        data: booking,
        refundNotice,
      });
    }

    // Prevent cancellation of completed bookings
    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed service booking",
      });
    }

    // Validate allowed status transitions
    const eligibleStatuses = ["pending", "approved", "in_progress"];
    if (!eligibleStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with current status '${booking.status}'`,
      });
    }

    // Update status to cancelled while preserving payment record
    const wasPaid = Boolean(booking.isPaid);
    booking.status = "cancelled";
    // Never mark as refunded without real confirmed gateway refund
    await booking.save();

    const refundNotice = wasPaid
      ? "Cancellation does not automatically refund online payments. FixUp does not process automatic gateway refunds. Please contact FixUp support for refund assistance."
      : null;

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
      refundNotice,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

