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

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

// Helper to sign JWTs for test users
const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 1 Security Test Suite", () => {
  let dbConnection;
  let adminUser;
  let adminToken;

  before(async () => {
    // Connect to database to setup test fixtures and clean up afterwards
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    dbConnection = await mongoose.connect(mongoUrl);

    // Find or create a test admin user for admin authorization testing
    adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Security Test Admin",
        email: "secadmin_test@test-security-suite.com",
        password: "hashedpassword123",
        role: "admin",
      });
    }
    adminToken = signToken(adminUser._id.toString(), "admin");

    // Clean up any stale test records from previous test runs
    await User.deleteMany({ email: { $regex: /@test-security-suite\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@test-security-suite\.com$/i } });
  });

  after(async () => {
    // Teardown: delete all test users and professionals created by this test suite
    await User.deleteMany({ email: { $regex: /@test-security-suite\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@test-security-suite\.com$/i } });
    await mongoose.disconnect();
  });

  // TEST SUITE 1: Ownership and Authorization Checks on Deletion
  describe("1. Ownership & Authorization Checks on deleteUser and deleteProfessional", () => {
    let customerA;
    let customerB;
    let profA;
    let profB;

    before(async () => {
      customerA = await User.create({
        name: "Customer A",
        email: "customer_a@test-security-suite.com",
        password: "hashedpassword123",
        role: "customer",
      });
      customerB = await User.create({
        name: "Customer B",
        email: "customer_b@test-security-suite.com",
        password: "hashedpassword123",
        role: "customer",
      });
      profA = await Profession.create({
        name: "Professional A",
        email: "prof_a@test-security-suite.com",
        password: "hashedpassword123",
        role: "professional",
        isApproved: "approved",
      });
      profB = await Profession.create({
        name: "Professional B",
        email: "prof_b@test-security-suite.com",
        password: "hashedpassword123",
        role: "professional",
        isApproved: "approved",
      });
    });

    test("Non-admin user cannot delete another customer account (403 Forbidden)", async () => {
      const tokenA = signToken(customerA._id.toString(), "customer");

      const res = await fetch(`${BASE_URL}/api/v1/users/${customerB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      const body = await res.json();
      assert.equal(res.status, 403, "Expected HTTP 403 Forbidden");
      assert.equal(body.success, false);
      assert.match(body.message, /Unauthorized/i);

      // Verify customer B still exists in database
      const checkB = await User.findById(customerB._id);
      assert.ok(checkB, "Customer B must not have been deleted");
    });

    test("Non-admin professional cannot delete another professional account (403 Forbidden)", async () => {
      const tokenProfA = signToken(profA._id.toString(), "professional");

      const res = await fetch(`${BASE_URL}/api/v1/professionals/${profB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenProfA}` },
      });

      const body = await res.json();
      assert.equal(res.status, 403, "Expected HTTP 403 Forbidden");
      assert.equal(body.success, false);
      assert.match(body.message, /Unauthorized/i);

      // Verify professional B still exists in database
      const checkProfB = await Profession.findById(profB._id);
      assert.ok(checkProfB, "Professional B must not have been deleted");
    });

    test("Admin is prevented from deleting their own admin account (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/${adminUser._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await res.json();
      assert.equal(res.status, 400, "Expected HTTP 400 Bad Request");
      assert.equal(body.success, false);
      assert.match(body.message, /cannot delete your own admin account/i);
    });

    test("Account owner CAN delete their own account (200 OK)", async () => {
      const tokenA = signToken(customerA._id.toString(), "customer");

      const res = await fetch(`${BASE_URL}/api/v1/users/${customerA._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      const body = await res.json();
      assert.equal(res.status, 200, "Expected HTTP 200 OK");
      assert.equal(body.success, true);

      // Verify customer A is removed from database
      const checkA = await User.findById(customerA._id);
      assert.equal(checkA, null, "Customer A should be deleted");
    });

    test("Authorized Admin CAN delete a user account (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/users/${customerB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await res.json();
      assert.equal(res.status, 200, "Expected HTTP 200 OK");
      assert.equal(body.success, true);

      // Verify customer B is removed from database
      const checkB = await User.findById(customerB._id);
      assert.equal(checkB, null, "Customer B should be deleted by admin");
    });
  });

  // TEST SUITE 2: Cross-Collection Email Uniqueness & Concurrent Registration Safety
  describe("2. Cross-Collection Email Uniqueness & Concurrent Registration Safety", () => {
    const testEmail = "shared_email@test-security-suite.com";

    test("Registers a customer account successfully (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Original Customer",
          email: testEmail,
          password: "SecretPassword123!",
          role: "customer",
          gender: "female",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
    });

    test("Rejects registering professional with the same email (case-insensitive) (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Professional",
          email: testEmail.toUpperCase(), // Test case-insensitivity
          password: "AnotherPassword123!",
          role: "professional",
          gender: "male",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.match(body.message, /already exists/i);

      // Verify no record created in Profession collection
      const profRecord = await Profession.findOne({ email: testEmail.toLowerCase() });
      assert.equal(profRecord, null, "Must not create professional with duplicate email");
    });

    test("Rejects registering another customer with the same email (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Customer",
          email: testEmail,
          password: "AnotherPassword123!",
          role: "customer",
          gender: "male",
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.match(body.message, /already exists/i);
    });

    test("Concurrent registration requests across roles resolve cleanly with at most one record", async () => {
      const raceEmail = "race_condition@test-security-suite.com";

      // Fire concurrent requests simultaneously
      const [resCustomer, resProf] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Race Customer",
            email: raceEmail,
            password: "Password123!",
            role: "customer",
          }),
        }),
        fetch(`${BASE_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Race Professional",
            email: raceEmail,
            password: "Password123!",
            role: "professional",
          }),
        }),
      ]);

      const [bodyCust, bodyProf] = await Promise.all([resCustomer.json(), resProf.json()]);

      // Exactly one or zero can succeed; both cannot succeed
      const successes = [bodyCust.success, bodyProf.success].filter(Boolean);
      assert.ok(
        successes.length <= 1,
        `Concurrent registrations must not both succeed. Succeeded count: ${successes.length}`
      );

      // Verify in DB that only one document exists across collections
      const [userInDb, profInDb] = await Promise.all([
        User.findOne({ email: raceEmail }),
        Profession.findOne({ email: raceEmail }),
      ]);

      const totalFound = (userInDb ? 1 : 0) + (profInDb ? 1 : 0);
      assert.ok(totalFound <= 1, `Total records in DB must be at most 1, found: ${totalFound}`);
    });
  });

  // TEST SUITE 3: Visibility and Bookability of Pending vs. Approved Professionals
  describe("3. Visibility & Bookability of Pending vs. Approved Professionals", () => {
    let pendingProf;
    let customerUser;
    let customerToken;

    before(async () => {
      pendingProf = await Profession.create({
        name: "Pending Pro Electrician",
        email: "pending_pro@test-security-suite.com",
        password: "hashedpassword123",
        role: "professional",
        specialization: "Electrician",
        ticketPrice: 650,
        isApproved: "pending",
        isActive: true,
      });

      customerUser = await User.create({
        name: "Booking Customer",
        email: "booking_customer@test-security-suite.com",
        password: "hashedpassword123",
        role: "customer",
      });
      customerToken = signToken(customerUser._id.toString(), "customer");
    });

    test("Pending professional is NOT visible in public directory (GET /api/v1/professionals)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      const found = body.data.find((p) => p._id === pendingProf._id.toString());
      assert.equal(found, undefined, "Pending professional must not appear in public directory");
    });

    test("Pending professional returns 404 in public details (GET /api/v1/professionals/:id)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${pendingProf._id}`);
      const body = await res.json();

      assert.equal(res.status, 404);
      assert.equal(body.success, false);
      assert.match(body.message, /No professional found/i);
    });

    test("Booking unapproved professional via Razorpay order creation is blocked (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/bookings/razorpay-order/${pendingProf._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.match(body.message, /not available for bookings/i);
    });

    test("Admin approves the professional (PATCH /api/v1/admin/professionals/:id/status)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/professionals/${pendingProf._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isApproved: "approved" }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.isApproved, "approved");
    });

    test("Approved professional is now visible in public directory", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals`);
      const body = await res.json();

      assert.equal(res.status, 200);
      const found = body.data.find((p) => p._id === pendingProf._id.toString());
      assert.ok(found, "Approved professional should now appear in public directory");
      assert.equal(found.name, "Pending Pro Electrician");
    });

    test("Approved professional is now accessible via public details (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals/${pendingProf._id}`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data._id, pendingProf._id.toString());
    });
  });
});
