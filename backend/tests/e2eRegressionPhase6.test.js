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
import Service from "../models/ServiceSchema.js";
import Booking from "../models/BookingSchema.js";
import Review from "../models/ReviewSchema.js";
import Contact from "../models/ContactSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret_key";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 6 — Comprehensive End-to-End Regression & Security Suite", () => {
  let adminUser, adminToken;
  let customerUser, customerToken;
  let proUser, proToken;
  let testService;
  let activePro;
  let createdBookingId;
  let createdContactId;

  const testSuffix = Date.now();

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up any existing test records
    await User.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^Phase6/i } });
    await Contact.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });

    // 1. Fixture: Admin
    adminUser = await User.create({
      name: "Phase 6 Super Admin",
      email: `admin_${testSuffix}@phase6-e2e.com`,
      password: "HashedPassword123",
      role: "admin",
    });
    adminToken = signToken(adminUser._id.toString(), "admin");

    // 2. Fixture: Verified Professional
    activePro = await Profession.create({
      name: "Master Electrician Alex",
      email: `alex_${testSuffix}@phase6-e2e.com`,
      password: "HashedPassword123",
      role: "professional",
      specialization: "Electrician",
      ticketPrice: 650,
      isApproved: "approved",
      isActive: true,
      timeSlots: ["09:00 AM - 11:00 AM", "02:00 PM - 04:00 PM"],
    });

    // 3. Fixture: Standard Service
    testService = await Service.create({
      name: `Phase6 Electrical Diagnostics ${testSuffix}`,
      desc: "Comprehensive home circuit and breaker inspection",
      price: 650,
      isActive: true,
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^Phase6/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /Phase6/i } });
    await Review.deleteMany({ reviewText: { $regex: /Phase6/i } });
    await Contact.deleteMany({ email: { $regex: /@phase6-e2e\.com$/i } });
    await mongoose.connection.close();
  });

  describe("1. Customer End-to-End Journey", () => {
    test("1.1 Customer Registration and Login", async () => {
      const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice Homeowner",
          email: `alice_${testSuffix}@phase6-e2e.com`,
          password: "SecurePassword123!",
          role: "customer",
          gender: "female",
        }),
      });
      const regData = await regRes.json();
      assert.equal(regRes.status, 200);
      assert.equal(regData.success, true);

      // Login
      const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `alice_${testSuffix}@phase6-e2e.com`,
          password: "SecurePassword123!",
          role: "customer",
        }),
      });
      const loginData = await loginRes.json();
      assert.equal(loginRes.status, 200);
      assert.equal(loginData.success, true);
      assert.ok(loginData.token, "Should receive JWT token on login");
      assert.equal(loginData.role, "customer");

      customerToken = loginData.token;
      customerUser = loginData.data;
    });

    test("1.2 Customer Browses Services & Directory with Category Filter", async () => {
      // Browse active services
      const sRes = await fetch(`${BASE_URL}/api/v1/services`);
      const sData = await sRes.json();
      assert.equal(sRes.status, 200);
      assert.equal(sData.success, true);
      assert.ok(Array.isArray(sData.data));

      // Directory search with category filter
      const pRes = await fetch(
        `${BASE_URL}/api/v1/professionals?category=Electrician&query=Alex`
      );
      const pData = await pRes.json();
      assert.equal(pRes.status, 200);
      assert.equal(pData.success, true);
      const found = pData.data.some((p) => p._id === activePro._id.toString());
      assert.ok(found, "Active professional must appear in directory search");
    });

    test("1.3 Customer Checks Availability & Books Appointment via Razorpay Verification", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateStr = tomorrow.toISOString().split("T")[0];

      // Check slot availability
      const availRes = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${activePro._id}?date=${dateStr}`
      );
      const availData = await availRes.json();
      assert.equal(availRes.status, 200);
      assert.ok(availData.allSlots.length > 0);

      // Simulate genuine payment verification with HMAC signature
      const orderId = `order_test_${Date.now()}`;
      const paymentId = `pay_test_${Date.now()}`;
      const signaturePayload = `${orderId}|${paymentId}`;
      const signature = crypto
        .createHmac("sha256", RAZORPAY_SECRET)
        .update(signaturePayload)
        .digest("hex");

      const verifyRes = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          professionalId: activePro._id.toString(),
          appointmentDate: dateStr,
          timeSlot: "09:00 AM - 11:00 AM",
          serviceAddress: "Phase6 123 Maple Street, Apt 4B",
          customerNotes: "Main breaker tripping",
          serviceId: testService._id.toString(),
        }),
      });

      const verifyData = await verifyRes.json();
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyData.success, true);
      assert.ok(verifyData.booking);
      assert.equal(Number(verifyData.booking.ticketPrice), 650);

      createdBookingId = verifyData.booking._id;

      // Slot is now taken
      const reAvailRes = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${activePro._id}?date=${dateStr}`
      );
      const reAvailData = await reAvailRes.json();
      assert.ok(reAvailData.bookedSlots.includes("09:00 AM - 11:00 AM"), "Booked time slot must be in bookedSlots");
    });

    test("1.4 Customer Cancels Booking & Availability Is Instantly Restored", async () => {
      const cancelRes = await fetch(
        `${BASE_URL}/api/v1/users/appointments/${createdBookingId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${customerToken}` },
        }
      );
      const cancelData = await cancelRes.json();
      assert.equal(cancelRes.status, 200);
      assert.equal(cancelData.success, true);
      assert.equal(cancelData.data.status, "cancelled");
      assert.ok(cancelData.refundNotice, "Must provide refund policy notice");

      // Verify slot is freed up
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const reAvailRes = await fetch(
        `${BASE_URL}/api/v1/bookings/availability/${activePro._id}?date=${dateStr}`
      );
      const reAvailData = await reAvailRes.json();
      assert.equal(reAvailData.bookedSlots.includes("09:00 AM - 11:00 AM"), false, "Cancelled appointment must free up time slot");
    });

    test("1.5 Review Eligibility: Only Completed Bookings Allow Reviews", async () => {
      // Attempting to review an uncompleted or cancelled booking -> Rejected
      const badRevRes = await fetch(
        `${BASE_URL}/api/v1/professionals/${activePro._id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            rating: 5,
            reviewText: "Phase6 Great service!",
            bookingId: createdBookingId,
          }),
        }
      );
      assert.equal(badRevRes.status, 400);

      // Create a completed booking fixture for this customer & pro
      const completedBooking = await Booking.create({
        professional: activePro._id,
        user: customerUser._id,
        appointmentDate: new Date(),
        timeSlot: "02:00 PM - 04:00 PM",
        serviceAddress: "Phase6 Completed Address",
        ticketPrice: 650,
        status: "completed",
        isPaid: true,
      });

      // Submit verified review
      const revRes = await fetch(
        `${BASE_URL}/api/v1/professionals/${activePro._id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            rating: 5,
            reviewText: "Phase6 Outstanding electrical diagnostics and safe repair!",
            bookingId: completedBooking._id.toString(),
          }),
        }
      );
      const revData = await revRes.json();
      assert.equal(revRes.status, 200);
      assert.equal(revData.success, true);

      // Duplicate review on the same booking must be rejected
      const dupRevRes = await fetch(
        `${BASE_URL}/api/v1/professionals/${activePro._id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({
            rating: 4,
            reviewText: "Phase6 Duplicate attempt",
            bookingId: completedBooking._id.toString(),
          }),
        }
      );
      assert.equal(dupRevRes.status, 400);
    });

    test("1.6 Customer Submits Contact Inquiry", async () => {
      const contactRes = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice Homeowner",
          email: `alice_${testSuffix}@phase6-e2e.com`,
          subject: "Commercial quote question",
          message: "Can your certified electricians service commercial single-phase properties as well?",
        }),
      });
      const contactData = await contactRes.json();
      assert.equal(contactRes.status, 201);
      assert.equal(contactData.success, true);
      assert.ok(contactData.data.id);
      createdContactId = contactData.data.id;
    });
  });

  describe("2. Professional Journey & Authorization Restrictions", () => {
    let pendingPro;

    test("2.1 Professional Registers with Pending Status", async () => {
      const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bob Apprentice",
          email: `bob_${testSuffix}@phase6-e2e.com`,
          password: "SecurePassword123!",
          role: "professional",
          gender: "male",
        }),
      });
      assert.equal(regRes.status, 200);

      // Verify pending status in DB
      pendingPro = await Profession.findOne({ email: `bob_${testSuffix}@phase6-e2e.com` });
      assert.equal(pendingPro.isApproved, "pending");

      // Verify unapproved pro is hidden from public directory
      const dirRes = await fetch(`${BASE_URL}/api/v1/professionals?query=Bob`);
      const dirData = await dirRes.json();
      const found = dirData.data.some((p) => p._id === pendingPro._id.toString());
      assert.equal(found, false, "Pending professional must NOT appear in public directory");

      // Direct public details fetch returns 404
      const detRes = await fetch(`${BASE_URL}/api/v1/professionals/${pendingPro._id}`);
      assert.equal(detRes.status, 404);
    });

    test("2.2 Professional Cannot Access Administrator Endpoints", async () => {
      proToken = signToken(pendingPro._id.toString(), "professional");

      const adminEndpoints = [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/users",
        "/api/v1/admin/professionals",
        "/api/v1/admin/bookings",
        "/api/v1/admin/services",
        "/api/v1/admin/contact-messages",
      ];

      for (const endpoint of adminEndpoints) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${proToken}` },
        });
        assert.equal(res.status, 403, `Professional must be forbidden from ${endpoint}`);
      }
    });
  });

  describe("3. Administrator End-to-End Workflow & Contact Inbox", () => {
    test("3.1 Admin Retrieves Dashboard Statistics & Approves Professional", async () => {
      const statsRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const statsData = await statsRes.json();
      assert.equal(statsRes.status, 200);
      assert.ok(statsData.data.users);
      assert.ok(statsData.data.professionals);
      assert.ok(statsData.data.bookings);

      // Approve pending professional
      const pendingPro = await Profession.findOne({ email: `bob_${testSuffix}@phase6-e2e.com` });
      const approveRes = await fetch(
        `${BASE_URL}/api/v1/admin/professionals/${pendingPro._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isApproved: "approved" }),
        }
      );
      assert.equal(approveRes.status, 200);

      // Pro is now visible publicly
      const dirRes = await fetch(`${BASE_URL}/api/v1/professionals?query=Bob`);
      const dirData = await dirRes.json();
      const found = dirData.data.some((p) => p._id === pendingPro._id.toString());
      assert.ok(found, "Approved professional is now visible in directory");
    });

    test("3.2 Admin Service Management CRUD & Booking Reference Protection", async () => {
      // 1. Create Service
      const createRes = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Phase6 Premium Carpentry ${testSuffix}`,
          desc: "Custom cabinetry and door fitting",
          price: 900,
          isActive: true,
        }),
      });
      const createData = await createRes.json();
      assert.equal(createRes.status, 201);
      const newServiceId = createData.data._id;

      // 2. Update Service
      const updateRes = await fetch(`${BASE_URL}/api/v1/admin/services/${newServiceId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: 950 }),
      });
      assert.equal(updateRes.status, 200);

      // 3. Deletion Protection: If booking references this service, deletion is blocked
      await Booking.create({
        professional: activePro._id,
        user: customerUser._id,
        service: newServiceId,
        appointmentDate: new Date(),
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "Phase6 Reference Test",
        ticketPrice: 950,
        status: "approved",
      });

      const delBlockedRes = await fetch(`${BASE_URL}/api/v1/admin/services/${newServiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(delBlockedRes.status, 409, "Must return 409 Conflict when deleting referenced service");

      // Deactivate instead
      const deactRes = await fetch(
        `${BASE_URL}/api/v1/admin/services/${newServiceId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: false }),
        }
      );
      assert.equal(deactRes.status, 200);
    });

    test("3.3 Admin Contact Inbox: Search, Filter, Auto-Read, Status Transitions & Deletion", async () => {
      // 1. List inquiries with search
      const listRes = await fetch(
        `${BASE_URL}/api/v1/admin/contact-messages?search=commercial`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const listData = await listRes.json();
      assert.equal(listRes.status, 200);
      assert.ok(listData.data.length > 0);
      assert.ok(listData.pagination);

      // 2. Open specific inquiry -> verifies auto-mark read
      const getRes = await fetch(
        `${BASE_URL}/api/v1/admin/contact-messages/${createdContactId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const getData = await getRes.json();
      assert.equal(getRes.status, 200);
      assert.equal(getData.data._id, createdContactId);
      assert.equal(getData.data.status, "read");

      // 3. Update status to resolved
      const statusRes = await fetch(
        `${BASE_URL}/api/v1/admin/contact-messages/${createdContactId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "resolved" }),
        }
      );
      const statusData = await statusRes.json();
      assert.equal(statusRes.status, 200);
      assert.equal(statusData.data.status, "resolved");

      // 4. Update status to archived
      const archiveRes = await fetch(
        `${BASE_URL}/api/v1/admin/contact-messages/${createdContactId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "archived" }),
        }
      );
      assert.equal(archiveRes.status, 200);
      assert.equal((await archiveRes.json()).data.status, "archived");

      // 5. Delete inquiry
      const delRes = await fetch(
        `${BASE_URL}/api/v1/admin/contact-messages/${createdContactId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      assert.equal(delRes.status, 200);

      // Confirm record is gone
      const checkDb = await Contact.findById(createdContactId);
      assert.equal(checkDb, null);
    });
  });

  describe("4. Security Guardrails & Edge Case Rejections", () => {
    test("4.1 Rejects unauthenticated requests to protected endpoints (401)", async () => {
      const protectedPaths = [
        { method: "GET", path: "/api/v1/users/appointments/my-appointments" },
        { method: "POST", path: `/api/v1/bookings/razorpay-order/${activePro._id}` },
        { method: "GET", path: "/api/v1/admin/dashboard" },
        { method: "GET", path: "/api/v1/admin/contact-messages" },
      ];

      for (const p of protectedPaths) {
        const res = await fetch(`${BASE_URL}${p.path}`, { method: p.method });
        assert.equal(res.status, 401, `Path ${p.path} must return 401 Unauthorized`);
      }
    });

    test("4.2 Rejects IDOR deletion across non-admin accounts (403)", async () => {
      // Create a second customer Charlie
      const charlie = await User.create({
        name: "Charlie Customer",
        email: `charlie_${testSuffix}@phase6-e2e.com`,
        password: "SecurePassword123!",
        role: "customer",
      });

      // Alice attempts to delete Charlie via user deletion endpoint -> 403 Forbidden
      const idorUserRes = await fetch(`${BASE_URL}/api/v1/users/${charlie._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(idorUserRes.status, 403, "Customer cannot delete another customer account");

      // Alice attempts to delete Bob via professional deletion endpoint -> 401 or 403
      const pendingPro = await Profession.findOne({ email: `bob_${testSuffix}@phase6-e2e.com` });
      if (pendingPro) {
        const idorProRes = await fetch(`${BASE_URL}/api/v1/professionals/${pendingPro._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        assert.ok([401, 403].includes(idorProRes.status), "Customer cannot delete another professional account");
      }
    });

    test("4.3 Rejects malformed ObjectIds with 400 Bad Request instead of server crash", async () => {
      const malformedPaths = [
        "/api/v1/professionals/invalid-id-1234",
        "/api/v1/admin/contact-messages/invalid-id-5678",
        "/api/v1/bookings/availability/not-a-valid-id?date=2026-10-20",
      ];

      for (const p of malformedPaths) {
        const res = await fetch(`${BASE_URL}${p}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.ok(
          res.status === 400 || res.status === 404,
          `Path ${p} must handle malformed ID safely (got ${res.status})`
        );
      }
    });
  });
});
