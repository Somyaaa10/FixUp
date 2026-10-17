import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
import PaymentOrder from "../models/PaymentOrderSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "your_key_secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp — Professional-Based Razorpay Payments Test Suite", () => {
  const testSuffix = Date.now();

  let customerUser1, customerToken1;
  let customerUser2, customerToken2;
  let proA_500, proB_1200, proInvalidPrice, proPending, proInactive;
  let serviceElectrical, servicePlumbing, serviceUnrelated;

  const futureDate = "2026-12-15";

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up any stale fixtures
    await User.deleteMany({ email: { $regex: /@razorpay-pricing-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@razorpay-pricing-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^RPTestService/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /RPPricingTest/i } });
    await PaymentOrder.deleteMany({ receipt: { $regex: /^rcpt_/i } });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("Password123!", salt);

    // 1. Seed Customer 1 & Customer 2
    customerUser1 = await User.create({
      name: "Customer One",
      email: `cust1_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "customer",
    });
    customerToken1 = signToken(customerUser1._id.toString(), "customer");

    customerUser2 = await User.create({
      name: "Customer Two",
      email: `cust2_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "customer",
    });
    customerToken2 = signToken(customerUser2._id.toString(), "customer");

    // 2. Seed Services
    serviceElectrical = await Service.create({
      name: "RPTestService Electrical Repair",
      desc: "Licensed electrical repairs",
      isActive: true,
    });

    servicePlumbing = await Service.create({
      name: "RPTestService Plumbing Fix",
      desc: "Master plumbing services",
      isActive: true,
    });

    serviceUnrelated = await Service.create({
      name: "RPTestService Landscaping",
      desc: "Yard care",
      isActive: true,
    });

    // 3. Seed Professional A with ticketPrice = 500 (Offers Electrical)
    proA_500 = await Profession.create({
      name: "Professional A (₹500)",
      email: `pro_a_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "RPTestService Electrical Repair",
      ticketPrice: 500,
      isApproved: "approved",
      isActive: true,
      services: [serviceElectrical._id],
    });

    // 4. Seed Professional B with ticketPrice = 1200 (Offers Plumbing)
    proB_1200 = await Profession.create({
      name: "Professional B (₹1200)",
      email: `pro_b_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "RPTestService Plumbing Fix",
      ticketPrice: 1200,
      isApproved: "approved",
      isActive: true,
      services: [servicePlumbing._id],
    });

    // 5. Seed Professional with Invalid Price (-50)
    proInvalidPrice = await Profession.create({
      name: "Professional Invalid Price",
      email: `pro_invalid_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "Electrician",
      ticketPrice: -50,
      isApproved: "approved",
      isActive: true,
    });

    // 6. Seed Pending Professional
    proPending = await Profession.create({
      name: "Professional Pending",
      email: `pro_pending_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "Electrician",
      ticketPrice: 600,
      isApproved: "pending",
      isActive: true,
    });

    // 7. Seed Inactive Professional
    proInactive = await Profession.create({
      name: "Professional Inactive",
      email: `pro_inactive_${testSuffix}@razorpay-pricing-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "Electrician",
      ticketPrice: 700,
      isApproved: "approved",
      isActive: false,
    });
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@razorpay-pricing-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@razorpay-pricing-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^RPTestService/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /RPPricingTest/i } });
    await PaymentOrder.deleteMany({ receipt: { $regex: /^rcpt_/i } });
    await mongoose.disconnect();
  });

  // -------------------------------------------------------------
  // Test 1: Professional A with price ₹500 creates order for 50000 paise
  // -------------------------------------------------------------
  test("1. Professional A with price ₹500 creates an order for 50000 paise", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proA_500._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
        serviceId: serviceElectrical._id.toString(),
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.order);
    assert.equal(body.order.amount, 50000, "₹500 must convert to 50000 paise");
    assert.equal(body.order.currency, "INR");
    assert.equal(body.bookingDetails.ticketPrice, 500);

    // Verify PaymentOrder was persisted in DB
    const savedOrder = await PaymentOrder.findOne({ orderId: body.order.id });
    assert.ok(savedOrder);
    assert.equal(savedOrder.amount, 50000);
    assert.equal(savedOrder.userId.toString(), customerUser1._id.toString());
    assert.equal(savedOrder.professionalId.toString(), proA_500._id.toString());
  });

  // -------------------------------------------------------------
  // Test 2: Professional B with price ₹1200 creates order for 120000 paise
  // -------------------------------------------------------------
  test("2. Professional B with price ₹1200 creates an order for 120000 paise", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proB_1200._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "11:00 AM - 01:00 PM",
        serviceAddress: "RPPricingTest 202 Beta Boulevard",
        serviceId: servicePlumbing._id.toString(),
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.order);
    assert.equal(body.order.amount, 120000, "₹1200 must convert to 120000 paise");
    assert.equal(body.order.currency, "INR");
    assert.equal(body.bookingDetails.ticketPrice, 1200);
  });

  // -------------------------------------------------------------
  // Test 3: Untrusted client-supplied amount or price is rejected/ignored
  // -------------------------------------------------------------
  test("3. Client cannot manipulate price (tampered ticketPrice is ignored; authoritative ₹1200 applied)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proB_1200._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "02:00 PM - 04:00 PM",
        serviceAddress: "RPPricingTest 202 Beta Boulevard",
        serviceId: servicePlumbing._id.toString(),
        ticketPrice: 20, // Malicious attempt to pay ₹20 instead of ₹1200
        amount: 2000,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.order.amount, 120000, "Backend must ignore client price and charge authoritative 120000 paise");
    assert.equal(body.bookingDetails.ticketPrice, 1200);
  });

  // -------------------------------------------------------------
  // Test 4: Invalid or non-positive ticketPrice is rejected
  // -------------------------------------------------------------
  test("4. Professional with invalid/negative ticketPrice is rejected (400 Bad Request)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proInvalidPrice._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 303 Gamma Lane",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /invalid professional service price/i);
  });

  // -------------------------------------------------------------
  // Test 5: Professional who does not offer service is rejected
  // -------------------------------------------------------------
  test("5. Professional who does not offer selected service is rejected (400 Bad Request)", async () => {
    // Pro A (Electrical) attempted to be booked for Landscaping
    const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proA_500._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "04:00 PM - 06:00 PM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
        serviceId: serviceUnrelated._id.toString(),
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /does not offer the selected service/i);
  });

  // -------------------------------------------------------------
  // Test 6: Pending or inactive professionals are rejected
  // -------------------------------------------------------------
  test("6. Pending or inactive professionals cannot be booked or paid (400 Bad Request)", async () => {
    // 6a: Pending
    const resPending = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proPending._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 404 Delta Ave",
      }),
    });
    assert.equal(resPending.status, 400);

    // 6b: Inactive
    const resInactive = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proInactive._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 404 Delta Ave",
      }),
    });
    assert.equal(resInactive.status, 400);
  });

  // -------------------------------------------------------------
  // Test 7: Invalid Razorpay signature is rejected
  // -------------------------------------------------------------
  test("7. Payment verification with invalid HMAC signature is rejected (400 Bad Request)", async () => {
    const fakeOrderId = `order_test_${Date.now()}_7`;
    const fakePaymentId = `pay_test_${Date.now()}_7`;

    const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: fakeOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: "invalid_forged_signature_hex_12345",
        professionalId: proA_500._id.toString(),
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.match(body.message, /Invalid signature/i);
  });

  // -------------------------------------------------------------
  // Test 8: Mismatched order ID / professional is rejected
  // -------------------------------------------------------------
  test("8. Order created for Pro A cannot be verified for Pro B (400 Bad Request)", async () => {
    // 1. Create order for Pro A
    const orderRes = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proA_500._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
        serviceId: serviceElectrical._id.toString(),
      }),
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    const paymentId = `pay_test_${Date.now()}_8`;
    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // 2. Attempt verify with Pro B
    const verifyRes = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proB_1200._id.toString(), // Mismatch!
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
      }),
    });

    const verifyData = await verifyRes.json();
    assert.equal(verifyRes.status, 400);
    assert.match(verifyData.message, /Order does not match selected professional|service fee/i);
  });

  // -------------------------------------------------------------
  // Test 9: Cross-customer isolation (Customer 2 cannot claim Customer 1's order)
  // -------------------------------------------------------------
  test("9. Cross-customer isolation: Customer 2 cannot verify Customer 1's order (403 Forbidden)", async () => {
    // 1. Customer 1 creates an order
    const orderRes = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proA_500._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
        serviceId: serviceElectrical._id.toString(),
      }),
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    const paymentId = `pay_test_${Date.now()}_9`;
    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // 2. Customer 2 attempts to verify that order
    const hijackRes = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken2}`, // Customer 2 token
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proA_500._id.toString(),
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest Customer 2 Address",
        serviceId: serviceElectrical._id.toString(),
      }),
    });

    const hijackData = await hijackRes.json();
    assert.equal(hijackRes.status, 403, "Must reject order hijacking with 403 Forbidden");
    assert.match(hijackData.message, /Order belongs to another customer/i);
  });

  // -------------------------------------------------------------
  // Test 10: Mismatched amount is rejected
  // -------------------------------------------------------------
  test("10. Payment order with tampered/mismatched amount is rejected (400 Bad Request)", async () => {
    // Create an order in PaymentOrder collection with tampered amount (e.g. 10000 instead of 50000)
    const tamperedOrderId = `order_test_${Date.now()}_tampered`;
    const paymentId = `pay_test_${Date.now()}_10`;
    await PaymentOrder.create({
      orderId: tamperedOrderId,
      userId: customerUser1._id,
      professionalId: proA_500._id,
      amount: 10000, // ₹100 instead of ₹500
      currency: "INR",
      receipt: `rcpt_tampered_${Date.now()}`,
      status: "created",
    });

    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${tamperedOrderId}|${paymentId}`)
      .digest("hex");

    const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: tamperedOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proA_500._id.toString(),
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.match(body.message, /Payment amount does not match professional service fee/i);
  });

  // -------------------------------------------------------------
  // Test 11: Cancelled payment order does not mark booking paid
  // -------------------------------------------------------------
  test("11. Cancelled payment order is rejected and does not create or pay booking (400 Bad Request)", async () => {
    const cancelledOrderId = `order_test_${Date.now()}_cancelled`;
    const paymentId = `pay_test_${Date.now()}_11`;
    await PaymentOrder.create({
      orderId: cancelledOrderId,
      userId: customerUser1._id,
      professionalId: proA_500._id,
      amount: 50000,
      currency: "INR",
      receipt: `rcpt_cancelled_${Date.now()}`,
      status: "cancelled", // Marked cancelled
    });

    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${cancelledOrderId}|${paymentId}`)
      .digest("hex");

    const res = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: cancelledOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proA_500._id.toString(),
        appointmentDate: futureDate,
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "RPPricingTest 101 Alpha Way",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.match(body.message, /Payment order has been cancelled/i);

    // Verify booking was not created
    const booking = await Booking.findOne({ razorpayOrderId: cancelledOrderId });
    assert.equal(booking, null, "No booking must be created for a cancelled order");
  });

  // -------------------------------------------------------------
  // Test 12 & 13: Successful verification updates only the correct booking & idempotent replay
  // -------------------------------------------------------------
  test("12 & 13. Legitimate payment verification creates booking and repeated verification is idempotent", async () => {
    const slot = "04:00 PM - 06:00 PM";
    const testDate = "2026-12-20";

    // 1. Create order
    const orderRes = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${proB_1200._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        appointmentDate: testDate,
        timeSlot: slot,
        serviceAddress: "RPPricingTest 202 Beta Boulevard",
        serviceId: servicePlumbing._id.toString(),
      }),
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    const paymentId = `pay_test_${Date.now()}_legit`;
    const signature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // 2. Verify payment
    const verifyRes = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proB_1200._id.toString(),
        appointmentDate: testDate,
        timeSlot: slot,
        serviceAddress: "RPPricingTest 202 Beta Boulevard",
        customerNotes: "RPPricingTest Ring front bell",
        serviceId: servicePlumbing._id.toString(),
      }),
    });

    const verifyData = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.booking);
    assert.equal(verifyData.booking.isPaid, true);
    assert.equal(verifyData.booking.status, "approved");
    assert.equal(verifyData.booking.ticketPrice, "1200");
    assert.equal(verifyData.booking.razorpayOrderId, orderId);
    assert.equal(verifyData.booking.razorpayPaymentId, paymentId);

    // Verify PaymentOrder status is updated to paid
    const updatedOrder = await PaymentOrder.findOne({ orderId });
    assert.equal(updatedOrder.status, "paid");
    assert.equal(updatedOrder.paymentId, paymentId);

    // 3. Repeated verification attempt (Idempotency)
    const repeatRes = await fetch(`${BASE_URL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        professionalId: proB_1200._id.toString(),
      }),
    });

    const repeatData = await repeatRes.json();
    assert.equal(repeatRes.status, 200);
    assert.equal(repeatData.success, true);
    assert.match(repeatData.message, /already verified/i);

    // Verify only ONE booking exists in DB
    const count = await Booking.countDocuments({ razorpayOrderId: orderId });
    assert.equal(count, 1, "Must not create duplicate bookings on repeated verification");
  });
});
