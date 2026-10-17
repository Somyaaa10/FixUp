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

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret_key";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Regression Test Suite — Professional Services Visibility & Category Filtering", () => {
  const testSuffix = Date.now();

  let customerUser, customerToken;
  let approvedPlumber, plumberToken;
  let approvedElectrician;
  let unapprovedPlumber;
  let inactivePlumber;

  let plumbingCatalogService;
  let electricalCatalogService;
  let customPlumbingService;
  let createdBookingId;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up any stale test fixtures
    await User.deleteMany({ email: { $regex: /@bugfix-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@bugfix-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^BugFixService/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /BugFixAddress/i } });
    await Review.deleteMany({ reviewText: { $regex: /BugFixReview/i } });

    // 1. Fixture: Customer
    customerUser = await User.create({
      name: "BugFix Customer Homeowner",
      email: `customer_${testSuffix}@bugfix-test.com`,
      password: "HashedPassword123",
      role: "customer",
    });
    customerToken = signToken(customerUser._id.toString(), "customer");

    // 2. Fixture: Approved Plumber
    approvedPlumber = await Profession.create({
      name: "BugFix Master Plumber",
      email: `plumber_${testSuffix}@bugfix-test.com`,
      password: "HashedPassword123",
      role: "professional",
      specialization: "Plumber",
      ticketPrice: 550,
      isApproved: "approved",
      isActive: true,
      timeSlots: ["09:00 AM - 11:00 AM", "02:00 PM - 04:00 PM"],
    });
    plumberToken = signToken(approvedPlumber._id.toString(), "professional");

    // 3. Fixture: Approved Electrician (unrelated trade)
    approvedElectrician = await Profession.create({
      name: "BugFix Master Electrician",
      email: `electrician_${testSuffix}@bugfix-test.com`,
      password: "HashedPassword123",
      role: "professional",
      specialization: "Electrician",
      ticketPrice: 650,
      isApproved: "approved",
      isActive: true,
    });

    // 4. Fixture: Unapproved (Pending) Plumber
    unapprovedPlumber = await Profession.create({
      name: "BugFix Pending Plumber",
      email: `pending_plumber_${testSuffix}@bugfix-test.com`,
      password: "HashedPassword123",
      role: "professional",
      specialization: "Plumber",
      ticketPrice: 500,
      isApproved: "pending",
      isActive: true,
    });

    // 5. Fixture: Inactive Plumber
    inactivePlumber = await Profession.create({
      name: "BugFix Inactive Plumber",
      email: `inactive_plumber_${testSuffix}@bugfix-test.com`,
      password: "HashedPassword123",
      role: "professional",
      specialization: "Plumber",
      ticketPrice: 500,
      isApproved: "approved",
      isActive: false,
    });

    // 6. Fixture: Existing Catalog Services
    plumbingCatalogService = await Service.create({
      name: `BugFixService Plumbing & Leak Repair ${testSuffix}`,
      desc: "Comprehensive diagnostic and pipe maintenance service",
      bgColor: "rgba(1, 181, 197, .2)",
      textColor: "#01B5C5",
      isActive: true,
    });

    electricalCatalogService = await Service.create({
      name: `BugFixService Electrical Maintenance ${testSuffix}`,
      desc: "Circuit inspection and lighting repairs",
      bgColor: "rgba(254, 182, 13, .2)",
      textColor: "#FEB60D",
      isActive: true,
    });
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@bugfix-test\.com$/i } });
      await Profession.deleteMany({ email: { $regex: /@bugfix-test\.com$/i } });
      await Service.deleteMany({ name: { $regex: /^BugFixService/i } });
      await Booking.deleteMany({ serviceAddress: { $regex: /BugFixAddress/i } });
      await Review.deleteMany({ reviewText: { $regex: /BugFixReview/i } });
      await mongoose.disconnect();
    } catch (err) {
      // ignore
    }
  });

  test("1. Plumber logs in and selects an existing catalog service without creating duplicates", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plumberToken}`,
      },
      body: JSON.stringify({
        serviceId: plumbingCatalogService._id.toString(),
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data._id.toString(), plumbingCatalogService._id.toString());

    // Verify in MongoDB: Plumber's services array now includes the catalog service
    const dbPlumber = await Profession.findById(approvedPlumber._id);
    assert.ok(
      dbPlumber.services.some((sId) => sId.toString() === plumbingCatalogService._id.toString()),
      "Plumber services array must store catalog service reference"
    );

    // Verify no duplicate service was created
    const count = await Service.countDocuments({
      name: plumbingCatalogService.name,
    });
    assert.equal(count, 1, "Must avoid creating duplicate services when selecting catalog service");
  });

  test("2. Plumber updates profile me endpoint with service offerings and specialization", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plumberToken}`,
      },
      body: JSON.stringify({
        specialization: "Plumber",
        services: [plumbingCatalogService._id.toString()],
        bio: "Certified Master Plumber with 10+ yrs experience",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.services), "Populated services must be an array");
    assert.ok(
      data.data.services.some((s) => s.name === plumbingCatalogService.name),
      "Returned profile must contain populated service object"
    );
  });

  test("3. Plumber registers a new custom service via POST /api/v1/services", async () => {
    const customName = `BugFixService Pipe Cleaning & Jetting ${testSuffix}`;
    const res = await fetch(`${BASE_URL}/api/v1/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plumberToken}`,
      },
      body: JSON.stringify({
        name: customName,
        desc: "High pressure hydro jetting and drain clearing",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.name, customName);
    customPlumbingService = data.data;

    // Verify service is saved to MongoDB and linked to plumber
    const dbPlumber = await Profession.findById(approvedPlumber._id);
    assert.ok(
      dbPlumber.services.some((sId) => sId.toString() === customPlumbingService._id.toString()),
      "Plumber services must now include the newly registered custom service"
    );
  });

  test("4. Customer fetches service catalog via GET /api/v1/services and verifies new service is listed", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/services`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));

    // Verify the newly registered service is present in the customer-facing catalog
    const hasCustomService = data.data.some((s) => s.name === customPlumbingService.name);
    assert.ok(hasCustomService, "Service added by plumber must be visible in the catalog");

    const hasCatalogService = data.data.some((s) => s.name === plumbingCatalogService.name);
    assert.ok(hasCatalogService, "Existing catalog service must also be visible");
  });

  test("5. Customer fetches professional directory by service category and finds the plumber", async () => {
    // 5.1 Query using the catalog service name
    const resCatalog = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(plumbingCatalogService.name)}`
    );
    const dataCatalog = await resCatalog.json();

    assert.equal(resCatalog.status, 200);
    assert.equal(dataCatalog.success, true);
    const foundPlumberCatalog = dataCatalog.data.some(
      (p) => p._id.toString() === approvedPlumber._id.toString()
    );
    assert.ok(
      foundPlumberCatalog,
      "Plumber must appear under the catalog service category they are assigned to"
    );

    // 5.2 Query using the newly registered custom service name
    const resCustom = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(customPlumbingService.name)}`
    );
    const dataCustom = await resCustom.json();

    assert.equal(resCustom.status, 200);
    assert.equal(dataCustom.success, true);
    const foundPlumberCustom = dataCustom.data.some(
      (p) => p._id.toString() === approvedPlumber._id.toString()
    );
    assert.ok(
      foundPlumberCustom,
      "Plumber must appear under the custom registered service category"
    );
  });

  test("6. Verify unrelated professionals do not appear in the plumbing category", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(plumbingCatalogService.name)}`
    );
    const data = await res.json();

    assert.equal(res.status, 200);
    const hasElectrician = data.data.some(
      (p) => p._id.toString() === approvedElectrician._id.toString()
    );
    assert.equal(
      hasElectrician,
      false,
      "Electrician should NOT appear under the plumbing service category"
    );
  });

  test("7. Verify unapproved and inactive professionals remain hidden in service queries", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(plumbingCatalogService.name)}`
    );
    const data = await res.json();

    assert.equal(res.status, 200);
    const hasPending = data.data.some(
      (p) => p._id.toString() === unapprovedPlumber._id.toString()
    );
    assert.equal(hasPending, false, "Pending unapproved plumber must remain hidden");

    const hasInactive = data.data.some(
      (p) => p._id.toString() === inactivePlumber._id.toString()
    );
    assert.equal(hasInactive, false, "Inactive plumber must remain hidden");
  });

  test("8. Verify category filtering and text search work together", async () => {
    // Search query 'Jetting' + category of the custom service -> Plumber matches
    const resBoth = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(
        customPlumbingService.name
      )}&query=Master`
    );
    const dataBoth = await resBoth.json();

    assert.equal(resBoth.status, 200);
    const found = dataBoth.data.some(
      (p) => p._id.toString() === approvedPlumber._id.toString()
    );
    assert.ok(found, "Plumber matching both category and search query must be returned");

    // Search query with conflicting term (e.g. Electrician) -> Clean empty list
    const resConflict = await fetch(
      `${BASE_URL}/api/v1/professionals?category=${encodeURIComponent(
        customPlumbingService.name
      )}&query=Electrician`
    );
    const dataConflict = await resConflict.json();
    assert.equal(resConflict.status, 200);
    assert.equal(dataConflict.data.length, 0, "Conflicting search and category must yield 0 results");
  });

  test("9. Verify customer can open professional details with populated services", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/${approvedPlumber._id}`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data._id.toString(), approvedPlumber._id.toString());
    assert.ok(Array.isArray(data.data.services), "Services must be populated as an array");
    assert.ok(
      data.data.services.some((s) => s.name === plumbingCatalogService.name),
      "Populated services must include the plumbing catalog service"
    );
  });

  test("10. Verify end-to-end booking, payment verification, and review workflows still work", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const appointmentDateStr = tomorrow.toISOString().split("T")[0];

    // 10.1 Create Razorpay Order
    const orderRes = await fetch(
      `${BASE_URL}/api/v1/bookings/razorpay-order/${approvedPlumber._id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          appointmentDate: appointmentDateStr,
          timeSlot: "09:00 AM - 11:00 AM",
          serviceAddress: "BugFixAddress 100, Test Avenue",
          customerNotes: "Need prompt leak inspection",
          serviceId: plumbingCatalogService._id.toString(),
        }),
      }
    );

    const orderData = await orderRes.json();
    assert.equal(orderRes.status, 200);
    assert.equal(orderData.success, true);
    assert.ok(orderData.order?.id);

    // 10.2 Verify Payment & Create Booking
    const orderId = orderData.order.id;
    const paymentId = `pay_${Date.now()}`;
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
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
        razorpay_signature: generatedSignature,
        professionalId: approvedPlumber._id.toString(),
        appointmentDate: appointmentDateStr,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "BugFixAddress 100, Test Avenue",
        customerNotes: "Need prompt leak inspection",
        serviceId: plumbingCatalogService._id.toString(),
      }),
    });

    const verifyData = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.booking?._id);
    createdBookingId = verifyData.booking._id;

    // Verify booking in DB references the service
    const dbBooking = await Booking.findById(createdBookingId);
    assert.equal(dbBooking.service.toString(), plumbingCatalogService._id.toString());
    assert.equal(dbBooking.serviceName, plumbingCatalogService.name);

    // 10.3 Professional updates booking status to completed
    const completeRes = await fetch(
      `${BASE_URL}/api/v1/professionals/appointments/${createdBookingId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${plumberToken}`,
        },
        body: JSON.stringify({ status: "completed" }),
      }
    );
    assert.equal(completeRes.status, 200);

    // 10.4 Customer checks review eligibility
    const eligRes = await fetch(
      `${BASE_URL}/api/v1/professionals/${approvedPlumber._id}/reviews/eligibility`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    const eligData = await eligRes.json();
    assert.equal(eligRes.status, 200);
    assert.equal(eligData.eligible, true);
    assert.equal(eligData.bookingId, createdBookingId.toString());

    // 10.5 Customer submits review
    const revRes = await fetch(
      `${BASE_URL}/api/v1/professionals/${approvedPlumber._id}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: "BugFixReview: Outstanding plumbing repair! Quick, clean, and reliable.",
          bookingId: createdBookingId.toString(),
        }),
      }
    );

    const revData = await revRes.json();
    assert.equal(revRes.status, 200);
    assert.equal(revData.success, true);
  });
});
