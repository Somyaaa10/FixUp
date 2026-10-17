import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Service from "../models/ServiceSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "your_key_secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 2 — Complete Customer Booking Flow Test Suite", () => {
  let dbConnection;
  let testCustomer;
  let customerToken;
  let approvedProfessional;
  let pendingProfessional;
  let inactiveProfessional;
  let testService;

  const futureDate = "2026-11-20";

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    dbConnection = await mongoose.connect(mongoUrl);

    // Clean up any stale test records from previous test runs
    await User.deleteMany({ email: { $regex: /@booking-phase2-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@booking-phase2-test\.com$/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /Phase2Test/i } });
    await Service.deleteMany({ name: "Phase 2 Test Electrical" });

    // Fixture: Customer
    testCustomer = await User.create({
      name: "Phase 2 Customer",
      email: "customer@booking-phase2-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    customerToken = signToken(testCustomer._id.toString(), "customer");

    // Fixture: Approved Professional with price 750
    approvedProfessional = await Profession.create({
      name: "Approved Pro Master",
      email: "approved_pro@booking-phase2-test.com",
      password: "hashedpassword123",
      role: "professional",
      specialization: "Plumbing & Leak Repairs",
      ticketPrice: 750,
      isApproved: "approved",
      isActive: true,
    });

    // Fixture: Pending Professional
    pendingProfessional = await Profession.create({
      name: "Pending Pro",
      email: "pending_pro@booking-phase2-test.com",
      password: "hashedpassword123",
      role: "professional",
      ticketPrice: 500,
      isApproved: "pending",
      isActive: true,
    });

    // Fixture: Inactive Professional
    inactiveProfessional = await Profession.create({
      name: "Inactive Pro",
      email: "inactive_pro@booking-phase2-test.com",
      password: "hashedpassword123",
      role: "professional",
      ticketPrice: 500,
      isApproved: "approved",
      isActive: false,
    });

    // Fixture: Service
    testService = await Service.create({
      name: "Phase 2 Test Electrical",
      desc: "Electrical testing service",
      isActive: true,
    });
  });

  after(async () => {
    // Teardown test fixtures
    await User.deleteMany({ email: { $regex: /@booking-phase2-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@booking-phase2-test\.com$/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /Phase2Test/i } });
    await Service.deleteMany({ name: "Phase 2 Test Electrical" });
    await mongoose.disconnect();
  });

  describe("1. Authorization & Professional Status Guards", () => {
    test("Rejects unauthenticated booking request (401 Unauthorized)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      assert.equal(res.status, 401);
    });

    test("Rejects booking unapproved professional (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${pendingProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.match(body.message, /not available for bookings/i);
    });

    test("Rejects booking inactive professional (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${inactiveProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.match(body.message, /not available for bookings/i);
    });
  });

  describe("2. Field Validations: Dates, Time Slots & Service Address", () => {
    test("Rejects missing appointment date (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /date is required/i);
    });

    test("Rejects past appointment date (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: "2020-01-01",
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /cannot be in the past/i);
    });

    test("Rejects missing or invalid time slot (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "   ",
            serviceAddress: "Phase2Test 123 Main St",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /time slot is required/i);
    });

    test("Rejects incomplete service address (< 5 characters) (400 Bad Request)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "abc",
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /complete service address/i);
    });

    test("Rejects invalid service ID (400 Bad Request)", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main St",
            serviceId: fakeId.toString(),
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /service is invalid/i);
    });
  });

  describe("3. Server-Controlled Pricing & Razorpay Order Creation", () => {
    test("Enforces database ticketPrice (750) and ignores client-submitted price (50)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: futureDate,
            timeSlot: "09:00 AM - 11:00 AM",
            serviceAddress: "Phase2Test 123 Main Street, Suite 4B",
            customerNotes: "Phase2Test Ring bell twice",
            serviceId: testService._id.toString(),
            ticketPrice: 50, // Malicious attempt to underpay
          }),
        }
      );

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.order, "Razorpay order object returned");
      // Verify price in paise is 75000 (₹750), not 5000 (₹50)
      assert.equal(body.order.amount, 75000, "Must calculate amount using trusted professional.ticketPrice (750 INR = 75000 paise)");
      assert.equal(body.bookingDetails.ticketPrice, 750);
      assert.equal(body.bookingDetails.serviceName, "Phase 2 Test Electrical");
    });
  });

  describe("4. Availability & Conflicting Appointment Prevention", () => {
    const conflictDate = "2026-11-25";
    const conflictSlot = "02:00 PM - 04:00 PM";

    test("Checks initial availability for professional on conflictDate", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${approvedProfessional._id}?date=${conflictDate}`
      );

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.bookedSlots));
      assert.equal(body.bookedSlots.includes(conflictSlot), false);
    });

    test("Pre-existing booking marks time slot as booked and rejects new booking (409 Conflict)", async () => {
      // Seed an approved booking for conflictSlot on conflictDate
      const seededDate = new Date(conflictDate);
      seededDate.setHours(0, 0, 0, 0);

      await Booking.create({
        professional: approvedProfessional._id,
        user: testCustomer._id,
        ticketPrice: "750",
        appointmentDate: seededDate,
        timeSlot: conflictSlot,
        serviceAddress: "Phase2Test 456 Existing St",
        status: "approved",
        isPaid: true,
      });

      // Query availability API again -> conflictSlot should now be in bookedSlots
      const availRes = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${approvedProfessional._id}?date=${conflictDate}`
      );
      const availBody = await availRes.json();
      assert.equal(availRes.status, 200);
      assert.ok(availBody.bookedSlots.includes(conflictSlot), "Booked slot must appear in bookedSlots");

      // Attempting to book the same slot returns 409 Conflict
      const bookRes = await fetch(
        `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedProfessional._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            appointmentDate: conflictDate,
            timeSlot: conflictSlot,
            serviceAddress: "Phase2Test Attempted Duplicate St",
          }),
        }
      );

      const bookBody = await bookRes.json();
      assert.equal(bookRes.status, 409, "Must return HTTP 409 Conflict for double-booking");
      assert.match(bookBody.message, /already booked/i);
    });
  });

  describe("5. Payment Verification, Idempotency & Dashboard Retrieval", () => {
    const paymentDate = "2026-11-28";
    const paymentSlot = "11:00 AM - 01:00 PM";
    const orderId = `order_test_${Date.now()}`;
    const paymentId = `pay_test_${Date.now()}`;

    // Generate valid HMAC signature matching Razorpay algorithm
    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    test("Rejects payment verification with invalid signature (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: "invalid_tampered_signature_12345",
          professionalId: approvedProfessional._id.toString(),
          appointmentDate: paymentDate,
          timeSlot: paymentSlot,
          serviceAddress: "Phase2Test 789 Verified Way",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.match(body.message, /Invalid signature/i);
    });

    test("Verifies genuine payment and creates booking with complete scheduling data (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          professionalId: approvedProfessional._id.toString(),
          appointmentDate: paymentDate,
          timeSlot: paymentSlot,
          serviceAddress: "Phase2Test 789 Verified Way, Suite 10",
          customerNotes: "Phase2Test Ring bell please",
          serviceId: testService._id.toString(),
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.booking, "Booking record returned");
      assert.equal(body.booking.isPaid, true);
      assert.equal(body.booking.status, "approved");
      assert.equal(body.booking.timeSlot, paymentSlot);
      assert.equal(body.booking.serviceAddress, "Phase2Test 789 Verified Way, Suite 10");
      assert.equal(body.booking.customerNotes, "Phase2Test Ring bell please");
      assert.equal(body.booking.ticketPrice, "750");

      // Verify booking is linked to customer in DB
      const userDoc = await User.findById(testCustomer._id);
      assert.ok(
        userDoc.appointments.some((id) => id.toString() === body.booking._id.toString()),
        "Booking must be linked in User appointments array"
      );
    });

    test("Idempotency: Replaying the same payment verification returns existing booking without creating duplicate (200 OK)", async () => {
      const countBefore = await Booking.countDocuments({ razorpayPaymentId: paymentId });

      const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          professionalId: approvedProfessional._id.toString(),
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.match(body.message, /already verified/i);

      const countAfter = await Booking.countDocuments({ razorpayPaymentId: paymentId });
      assert.equal(countBefore, countAfter, "Must not create duplicate booking records for same payment");
    });

    test("Customer dashboard retrieves verified booking with full scheduling details", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));

      const found = body.data.find((b) => b.razorpayPaymentId === paymentId);
      assert.ok(found, "Saved booking must appear in customer appointments");
      assert.equal(found.timeSlot, paymentSlot);
      assert.equal(found.serviceAddress, "Phase2Test 789 Verified Way, Suite 10");
      assert.equal(found.customerNotes, "Phase2Test Ring bell please");
      assert.equal(found.ticketPrice, "750");
      assert.equal(found.isPaid, true);
      assert.equal(found.status, "approved");
      assert.equal(found.professional.name, "Approved Pro Master");
    });
  });
});
