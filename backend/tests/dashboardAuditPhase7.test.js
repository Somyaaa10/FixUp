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
import Service from "../models/ServiceSchema.js";
import Review from "../models/ReviewSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 7 — Comprehensive Dashboard & Security Audit Suite", () => {
  let dbConnection;
  let adminUser, adminToken;
  let customerA, customerAToken;
  let customerB, customerBToken;
  let profA, profAToken;
  let profB, profBToken;
  let testService;
  let testBookingA;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    dbConnection = await mongoose.connect(mongoUrl);

    // Clean up past test fixtures
    await User.deleteMany({ email: { $regex: /@dash-audit-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@dash-audit-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^(Audit Test Service|Temporary Audit Service)/i } });

    // 1. Admin setup
    adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Audit Admin",
        email: "admin@dash-audit-test.com",
        password: "hashedpassword123",
        role: "admin",
      });
    }
    adminToken = signToken(adminUser._id.toString(), "admin");

    // 2. Customer setup
    customerA = await User.create({
      name: "Customer Alpha",
      email: "customera@dash-audit-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    customerAToken = signToken(customerA._id.toString(), "customer");

    customerB = await User.create({
      name: "Customer Beta",
      email: "customerb@dash-audit-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    customerBToken = signToken(customerB._id.toString(), "customer");

    // 3. Professional setup
    profA = await Profession.create({
      name: "Pro Alpha",
      email: "profa@dash-audit-test.com",
      password: "hashedpassword123",
      role: "professional",
      specialization: "Plumber",
      ticketPrice: 650,
      isApproved: "approved",
      isActive: true,
    });
    profAToken = signToken(profA._id.toString(), "professional");

    profB = await Profession.create({
      name: "Pro Beta",
      email: "profb@dash-audit-test.com",
      password: "hashedpassword123",
      role: "professional",
      specialization: "Electrician",
      ticketPrice: 800,
      isApproved: "pending",
      isActive: true,
    });
    profBToken = signToken(profB._id.toString(), "professional");

    // 4. Test Service
    testService = await Service.create({
      name: "Audit Test Service Plumbing",
      desc: "Emergency pipe leak repairs",
      isActive: true,
    });

    // 5. Test Booking for Customer A with Pro A
    testBookingA = await Booking.create({
      user: customerA._id,
      professional: profA._id,
      service: testService._id,
      serviceName: "Audit Test Service Plumbing",
      ticketPrice: "650",
      appointmentDate: new Date(Date.now() + 86400000), // tomorrow
      timeSlot: "09:00 AM - 11:00 AM",
      serviceAddress: "123 Test Street, Apartment 4B",
      status: "approved",
      isPaid: true,
      razorpayOrderId: "order_test_audit_1",
      razorpayPaymentId: "pay_test_audit_1",
    });
  });

  after(async () => {
    if (testBookingA) {
      await Booking.deleteMany({ _id: testBookingA._id });
    }
    await User.deleteMany({ email: { $regex: /@dash-audit-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@dash-audit-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^Audit Test Service/i } });
    await Booking.deleteMany({ customerNotes: "audit-test-fixture" });
    await Review.deleteMany({ reviewText: { $regex: /^Audit Test Review/i } });
    await mongoose.disconnect();
  });

  // ========================================================
  // SECTION 1: ADMIN DASHBOARD STATISTICS & ACCESS CONTROLS
  // ========================================================
  describe("1. Admin Dashboard Statistics & Access Controls", () => {
    test("1.1 Non-admin cannot access GET /api/v1/admin/dashboard (401 / 403)", async () => {
      // Unauthenticated
      const unauthRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`);
      assert.equal(unauthRes.status, 401, "Expected 401 for unauthenticated request");

      // Customer token
      const custRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.equal(custRes.status, 403, "Expected 403 Forbidden for customer");

      // Professional token
      const profRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${profAToken}` },
      });
      assert.equal(profRes.status, 403, "Expected 403 Forbidden for professional");
    });

    test("1.2 Authorized admin retrieves all dashboard platform metrics including completed & pending counts", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 200, "Expected 200 OK for admin");
      const data = await res.json();
      assert.equal(data.success, true);

      // Verify all required platform metrics exist
      assert.ok(typeof data.data.users.total === "number", "users.total must be a number");
      assert.ok(typeof data.data.professionals.total === "number", "professionals.total must be a number");
      assert.ok(typeof data.data.professionals.pending === "number", "professionals.pending must be a number");
      assert.ok(typeof data.data.professionals.approved === "number", "professionals.approved must be a number");
      assert.ok(typeof data.data.bookings.total === "number", "bookings.total must be a number");
      assert.ok(typeof data.data.bookings.pending === "number", "bookings.pending must be a number");
      assert.ok(typeof data.data.bookings.approved === "number", "bookings.approved must be a number");
      assert.ok(typeof data.data.bookings.completed === "number", "bookings.completed must be a number");
      assert.ok(typeof data.data.bookings.cancelled === "number", "bookings.cancelled must be a number");
      assert.ok(typeof data.data.revenue.total === "number", "revenue.total must be a number");
    });
  });

  // ========================================================
  // SECTION 2: CUSTOMER DASHBOARD & CANCELLATION INTEGRITY
  // ========================================================
  describe("2. Customer Dashboard & Booking Security", () => {
    test("2.1 Customer retrieves only their own appointments via GET /api/v1/users/appointments/my-appointments", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));

      // Customer A should see testBookingA
      const hasBookingA = data.data.some(
        (b) => String(b.bookingId || b._id) === String(testBookingA._id)
      );
      assert.equal(hasBookingA, true, "Customer A must see their own booking");

      // Customer B should NOT see testBookingA
      const resB = await fetch(`${BASE_URL}/api/v1/users/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      const dataB = await resB.json();
      const bHasBookingA = dataB.data.some(
        (b) => String(b.bookingId || b._id) === String(testBookingA._id)
      );
      assert.equal(bHasBookingA, false, "Customer B must not see Customer A's booking");
    });

    test("2.2 Customer B cannot cancel Customer A's booking (403 Forbidden)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/users/appointments/${testBookingA._id}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${customerBToken}` },
        }
      );

      assert.equal(res.status, 403, "Expected 403 when cancelling another user's booking");
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test("2.3 Customer A can cancel their own eligible booking; preserves isPaid without automatic refund", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/users/appointments/${testBookingA._id}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${customerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.status, "cancelled");
      assert.equal(data.data.isPaid, true, "Payment record must be preserved");
      assert.ok(data.refundNotice, "Refund policy notice must be returned");

      // Verify idempotency: Cancelling an already cancelled booking returns 200 without error
      const repeatRes = await fetch(
        `${BASE_URL}/api/v1/users/appointments/${testBookingA._id}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${customerAToken}` },
        }
      );
      assert.equal(repeatRes.status, 200, "Idempotent cancellation must succeed safely");
    });
  });

  // ========================================================
  // SECTION 3: PROFESSIONAL DASHBOARD & STATUS TRANSITIONS
  // ========================================================
  describe("3. Professional Dashboard & Workflow Guardrails", () => {
    let proBooking;

    before(async () => {
      // Create a fresh booking for Professional A
      proBooking = await Booking.create({
        user: customerA._id,
        professional: profA._id,
        service: testService._id,
        serviceName: "Audit Pipe Repair",
        ticketPrice: "650",
        appointmentDate: new Date(Date.now() + 172800000), // in 2 days
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "456 Test Boulevard",
        status: "approved",
        isPaid: true,
        customerNotes: "audit-test-fixture",
      });
    });

    after(async () => {
      if (proBooking) {
        await Booking.deleteMany({ _id: proBooking._id });
      }
    });

    test("3.1 Professional B cannot update status of Professional A's booking (404 Not Found)", async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/professionals/appointments/${proBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${profBToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "in_progress" }),
        }
      );

      assert.equal(res.status, 404, "Expected 404 for booking not assigned to pro account");
    });

    test("3.2 Professional A can update status to in_progress and completed", async () => {
      // Step 1: In progress
      const resProgress = await fetch(
        `${BASE_URL}/api/v1/professionals/appointments/${proBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${profAToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "in_progress" }),
        }
      );
      assert.equal(resProgress.status, 200);

      // Step 2: Completed
      const resCompleted = await fetch(
        `${BASE_URL}/api/v1/professionals/appointments/${proBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${profAToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "completed" }),
        }
      );
      assert.equal(resCompleted.status, 200);

      // Step 3: Reopening completed booking is rejected
      const resReopen = await fetch(
        `${BASE_URL}/api/v1/professionals/appointments/${proBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${profAToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "approved" }),
        }
      );
      assert.equal(resReopen.status, 400, "Completed booking cannot be reopened");
    });
  });

  // ========================================================
  // SECTION 4: PROFESSIONAL VISIBILITY & DIRECTORY APPROVAL
  // ========================================================
  describe("4. Professional Approval Lifecycle & Directory Visibility", () => {
    test("4.1 Pending professional is hidden from public directory and details", async () => {
      // Check public list: profB (pending) must not be included
      const listRes = await fetch(`${BASE_URL}/api/v1/professionals`);
      const listData = await listRes.json();
      const hasProfB = listData.data.some((p) => String(p._id) === String(profB._id));
      assert.equal(hasProfB, false, "Pending professional must not appear in directory");

      // Check public details: profB returns 404
      const detailsRes = await fetch(`${BASE_URL}/api/v1/professionals/${profB._id}`);
      assert.equal(detailsRes.status, 404, "Pending professional details must return 404");
    });

    test("4.2 Admin approves professional -> immediately accessible in public directory", async () => {
      // Admin approves profB
      const approveRes = await fetch(
        `${BASE_URL}/api/v1/admin/professionals/${profB._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isApproved: "approved", isActive: true }),
        }
      );
      assert.equal(approveRes.status, 200);

      // Verify now accessible via public details
      const detailsRes = await fetch(`${BASE_URL}/api/v1/professionals/${profB._id}`);
      assert.equal(detailsRes.status, 200, "Approved professional must be accessible");
    });
  });

  // ========================================================
  // SECTION 5: SERVICE MANAGEMENT CRUD & DELETION SAFEGUARD
  // ========================================================
  describe("5. Service Catalog Reference Safeguard", () => {
    test("5.1 Deleting service referenced by bookings is rejected with 409 Conflict", async () => {
      // testService is referenced by testBookingA
      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${testService._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 409, "Expected 409 Conflict when deleting referenced service");
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.bookingCount > 0);
    });

    test("5.2 Admin can delete an unreferenced service cleanly", async () => {
      // Create temporary unreferenced service
      const tempService = await Service.create({
        name: "Temporary Audit Service Unreferenced",
        desc: "Will be deleted",
        isActive: true,
      });

      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${tempService._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 200, "Expected 200 OK for deleting unreferenced service");
    });
  });
});
