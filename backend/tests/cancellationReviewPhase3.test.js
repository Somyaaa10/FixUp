import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";
import Booking from "../models/BookingSchema.js";
import Review from "../models/ReviewSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 3 — Customer Booking Cancellation and Review Eligibility Test Suite", () => {
  let dbConnection;
  let customerA;
  let customerB;
  let tokenCustomerA;
  let tokenCustomerB;
  let professional1;
  let professional2;

  const testSlot = "02:00 PM - 04:00 PM";
  const testDate = "2026-11-25";

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    dbConnection = await mongoose.connect(mongoUrl);

    // Clean up test collections
    await User.deleteMany({ email: { $regex: /@phase3-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phase3-test\.com$/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /Phase3Address/i } });
    await Review.deleteMany({ reviewText: { $regex: /Phase3Review/i } });

    // Customer A
    customerA = await User.create({
      name: "Phase 3 Customer A",
      email: "customer_a@phase3-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    tokenCustomerA = signToken(customerA._id.toString(), "customer");

    // Customer B
    customerB = await User.create({
      name: "Phase 3 Customer B",
      email: "customer_b@phase3-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    tokenCustomerB = signToken(customerB._id.toString(), "customer");

    // Professional 1
    professional1 = await Profession.create({
      name: "Phase 3 Pro 1",
      email: "pro1@phase3-test.com",
      password: "hashedpassword123",
      specialization: "Appliance Repair",
      ticketPrice: 650,
      isApproved: "approved",
      isActive: true,
      role: "professional",
      averageRating: 0,
      totalRating: 0,
    });

    // Professional 2
    professional2 = await Profession.create({
      name: "Phase 3 Pro 2",
      email: "pro2@phase3-test.com",
      password: "hashedpassword123",
      specialization: "Plumbing",
      ticketPrice: 500,
      isApproved: "approved",
      isActive: true,
      role: "professional",
      averageRating: 0,
      totalRating: 0,
    });
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@phase3-test\.com$/i } });
      await Profession.deleteMany({ email: { $regex: /@phase3-test\.com$/i } });
      await Booking.deleteMany({ serviceAddress: { $regex: /Phase3Address/i } });
      await Review.deleteMany({ reviewText: { $regex: /Phase3Review/i } });
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  });

  // ========================================================
  // SUITE 1: CUSTOMER BOOKING CANCELLATION
  // ========================================================
  describe("Customer Booking Cancellation", () => {
    test("1. Customer can cancel their own eligible booking via /users/appointments/:id/cancel", async () => {
      const booking = await Booking.create({
        user: customerA._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: testSlot,
        serviceAddress: "Phase3Address 101, Test Street",
        ticketPrice: "650",
        status: "approved",
        isPaid: false,
      });

      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.message, "Booking cancelled successfully");
      assert.equal(data.data.status, "cancelled");

      const dbBooking = await Booking.findById(booking._id);
      assert.equal(dbBooking.status, "cancelled");
    });

    test("2. Customer can also cancel their own eligible booking via /bookings/:id/cancel", async () => {
      const booking = await Booking.create({
        user: customerA._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "Phase3Address 102, Test Street",
        ticketPrice: "650",
        status: "pending",
        isPaid: false,
      });

      const res = await fetch(`${BASE_URL}/api/v1/bookings/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, "cancelled");
    });

    test("3. Customer attempting to cancel another customer's booking is rejected with 403", async () => {
      const bookingB = await Booking.create({
        user: customerB._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "04:00 PM - 06:00 PM",
        serviceAddress: "Phase3Address 103, Customer B Home",
        ticketPrice: "650",
        status: "approved",
        isPaid: false,
      });

      // Customer A tries to cancel Customer B's booking
      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/${bookingB._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 403);
      assert.equal(data.success, false);
      assert.match(data.message, /only cancel your own/i);

      // Verify status in DB was unchanged
      const dbBooking = await Booking.findById(bookingB._id);
      assert.equal(dbBooking.status, "approved");
    });

    test("4. Repeated cancellation requests are idempotent (200 success without error)", async () => {
      const booking = await Booking.create({
        user: customerA._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "Phase3Address 104, Repeated Cancel",
        ticketPrice: "650",
        status: "cancelled",
        isPaid: false,
      });

      // First repeat call
      const res1 = await fetch(`${BASE_URL}/api/v1/users/appointments/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });
      const data1 = await res1.json();
      assert.equal(res1.status, 200);
      assert.equal(data1.success, true);
      assert.match(data1.message, /already cancelled/i);

      // Second repeat call
      const res2 = await fetch(`${BASE_URL}/api/v1/users/appointments/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });
      const data2 = await res2.json();
      assert.equal(res2.status, 200);
      assert.equal(data2.success, true);
      assert.equal(data2.data.status, "cancelled");
    });

    test("5. Cancellation of completed bookings is rejected with 400 Bad Request", async () => {
      const completedBooking = await Booking.create({
        user: customerA._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "Phase3Address 105, Completed Job",
        ticketPrice: "650",
        status: "completed",
        isPaid: true,
      });

      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/${completedBooking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /cannot cancel a completed/i);

      // Status in DB remains completed
      const dbBooking = await Booking.findById(completedBooking._id);
      assert.equal(dbBooking.status, "completed");
    });

    test("6. Paid booking cancellation preserves isPaid=true and provides refund disclaimer", async () => {
      const paidBooking = await Booking.create({
        user: customerA._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "Phase3Address 106, Paid Booking",
        ticketPrice: "650",
        status: "approved",
        isPaid: true,
        razorpayPaymentId: "pay_test_phase3_sample",
        razorpayOrderId: "order_test_phase3_sample",
      });

      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/${paidBooking._id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, "cancelled");
      assert.equal(data.data.isPaid, true);
      assert.ok(data.refundNotice, "refundNotice should be present for paid bookings");
      assert.match(data.refundNotice, /does not automatically refund/i);

      // Verify database record has not falsely set isPaid: false
      const dbBooking = await Booking.findById(paidBooking._id);
      assert.equal(dbBooking.isPaid, true);
      assert.equal(dbBooking.status, "cancelled");
    });

    test("7. Cancelled booking immediately frees up appointment slot in availability check", async () => {
      // Verify slot testSlot is now available because previous test booking was cancelled
      const res = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${professional1._id}?date=${testDate}`
      );
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(!data.bookedSlots.includes(testSlot), "Slot should be freed after cancellation");
    });
  });

  // ========================================================
  // SUITE 2: REVIEW ELIGIBILITY & RATING RECALCULATION
  // ========================================================
  describe("Review Eligibility and Ratings", () => {
    test("8. Review submission without any completed booking is rejected with 403 Forbidden", async () => {
      // Customer B has no completed booking for Professional 2
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerB}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: "Phase3Review: Great plumber even though I never hired him!",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 403);
      assert.equal(data.success, false);
      assert.match(data.message, /must have a completed booking/i);
    });

    test("9. Review submission for another customer's completed booking is rejected with 403", async () => {
      // Completed booking for Customer B
      const bookingB = await Booking.create({
        user: customerB._id,
        professional: professional1._id,
        appointmentDate: new Date(testDate),
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "Phase3Address 107, Customer B Completed Job",
        ticketPrice: "650",
        status: "completed",
        isPaid: true,
      });

      // Customer A tries to review Professional 1 using Customer B's booking
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional1._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 4,
          reviewText: "Phase3Review: Trying to review using someone else's booking",
          bookingId: bookingB._id.toString(),
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 403);
      assert.equal(data.success, false);
      assert.match(data.message, /only review bookings made by your own/i);
    });

    test("10. Review submission for an uncompleted booking is rejected with 400", async () => {
      const pendingBookingA = await Booking.create({
        user: customerA._id,
        professional: professional2._id,
        appointmentDate: new Date(testDate),
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "Phase3Address 108, Customer A Pending",
        ticketPrice: "500",
        status: "approved",
        isPaid: false,
      });

      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: "Phase3Review: Reviewing before the job is finished",
          bookingId: pendingBookingA._id.toString(),
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /cannot review an uncompleted booking/i);
    });

    test("11. Invalid rating values are rejected with 400 Bad Request", async () => {
      // Completed booking for Customer A with Professional 2
      const completedBooking = await Booking.create({
        user: customerA._id,
        professional: professional2._id,
        appointmentDate: new Date(testDate),
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "Phase3Address 109, Customer A Completed",
        ticketPrice: "500",
        status: "completed",
        isPaid: true,
      });

      // Rating = 0
      const res0 = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 0,
          reviewText: "Phase3Review: Zero stars",
          bookingId: completedBooking._id.toString(),
        }),
      });
      assert.equal(res0.status, 400);

      // Rating = 6
      const res6 = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 6,
          reviewText: "Phase3Review: Six stars",
          bookingId: completedBooking._id.toString(),
        }),
      });
      assert.equal(res6.status, 400);

      // Rating = 3.5 (non-integer)
      const resFloat = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 3.5,
          reviewText: "Phase3Review: Decimal rating",
          bookingId: completedBooking._id.toString(),
        }),
      });
      assert.equal(resFloat.status, 400);

      // Empty review text
      const resEmptyText = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: "   ",
          bookingId: completedBooking._id.toString(),
        }),
      });
      assert.equal(resEmptyText.status, 400);
    });

    test("12. Check eligibility endpoint returns eligible: true for completed unreviewed booking", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews/eligibility`, {
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.eligible, true);
      assert.ok(data.bookingId, "Should return an eligible booking ID");
    });

    test("13. Eligible review submission succeeds and stores booking reference", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: "Phase3Review: Punctual and fixed the pipe in 20 minutes!",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.rating, 5);
      assert.ok(data.data.booking, "Review must be linked to the booking");

      const savedReview = await Review.findById(data.data._id);
      assert.ok(savedReview.booking);
    });

    test("14. Duplicate review submission on the same completed booking is rejected with 400", async () => {
      // Customer A tries to submit a second review for Professional 2 without having any other completed bookings
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerA}`,
        },
        body: JSON.stringify({
          rating: 4,
          reviewText: "Phase3Review: Trying to review twice on the same completed booking",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);

      // Check eligibility endpoint now returns eligible: false
      const elRes = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews/eligibility`, {
        headers: {
          Authorization: `Bearer ${tokenCustomerA}`,
        },
      });
      const elData = await elRes.json();
      assert.equal(elRes.status, 200);
      assert.equal(elData.eligible, false);
      assert.match(elData.message, /already reviewed all your completed bookings/i);
    });

    test("15. Correct average-rating calculation across multiple verified reviews", async () => {
      // Professional 2 has one review of 5 stars from Customer A.
      // Now Customer B gets a completed booking with Professional 2 and rates 3 stars.
      const bookingB = await Booking.create({
        user: customerB._id,
        professional: professional2._id,
        appointmentDate: new Date(testDate),
        timeSlot: "02:00 PM - 04:00 PM",
        serviceAddress: "Phase3Address 110, Customer B Completed Job",
        ticketPrice: "500",
        status: "completed",
        isPaid: true,
      });

      const res = await fetch(`${BASE_URL}/api/v1/professionals/${professional2._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenCustomerB}`,
        },
        body: JSON.stringify({
          rating: 3,
          reviewText: "Phase3Review: Average plumbing service",
          bookingId: bookingB._id.toString(),
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);

      // Recalculated rating: (5 + 3) / 2 = 4.0
      const updatedPro = await Profession.findById(professional2._id);
      assert.equal(updatedPro.totalRating, 2);
      assert.equal(Number(updatedPro.averageRating), 4.0);
    });
  });
});
