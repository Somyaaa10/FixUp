import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp End-to-End Test Suite — Professional Profile Lifecycle & Visibility", () => {
  const testSuffix = Date.now();

  let adminUser, adminToken;
  let customerUser, customerToken;
  let proEmail, proPassword;
  let proToken, proId;
  let catalogService;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up any stale test fixtures
    await User.deleteMany({ email: { $regex: /@profile-vis-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@profile-vis-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^VisibilityService/i } });

    // Seed admin
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("AdminPass123!", salt);
    adminUser = await User.create({
      name: "Super Administrator",
      email: `admin_${testSuffix}@profile-vis-test.com`,
      password: hashPassword,
      role: "admin",
    });
    adminToken = signToken(adminUser._id.toString(), "admin");

    // Seed customer
    customerUser = await User.create({
      name: "Alice Homeowner",
      email: `customer_${testSuffix}@profile-vis-test.com`,
      password: hashPassword,
      role: "customer",
    });
    customerToken = signToken(customerUser._id.toString(), "customer");

    // Seed a catalog service
    catalogService = await Service.create({
      name: `VisibilityService Carpentry ${testSuffix}`,
      desc: "Expert wooden carpentry and furniture repair",
      isActive: true,
    });

    proEmail = `carpenter_${testSuffix}@profile-vis-test.com`;
    proPassword = "ProPassword123!";
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@profile-vis-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@profile-vis-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^VisibilityService/i } });
    await mongoose.disconnect();
  });

  test("1. Register and log in as a professional", async () => {
    // Register
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "David Carpenter",
        email: proEmail,
        password: proPassword,
        role: "professional",
        gender: "male",
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
        email: proEmail,
        password: proPassword,
        role: "professional",
      }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginData.success, true);
    assert.equal(loginData.role, "professional");
    assert.ok(loginData.token);

    proToken = loginData.token;
    proId = loginData.data._id;
    assert.ok(proId, "Logged in professional should have a valid _id");
  });

  test("2. Create and save the professional profile", async () => {
    const updateRes = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "David Carpenter Master",
        phone: "+91 9988776655",
        specialization: "Carpenter",
        bio: "Master craftsman specializing in custom cabinetry",
        about: "Over 10 years of experience delivering premium carpentry and woodwork.",
        services: [catalogService._id.toString()],
      }),
    });

    const updateData = await updateRes.json();
    assert.equal(updateRes.status, 200);
    assert.equal(updateData.success, true);
    assert.equal(updateData.data.name, "David Carpenter Master");
    assert.equal(updateData.data.specialization, "Carpenter");
    assert.equal(updateData.data.services.length, 1);
  });

  test("3. Confirm the profile exists in MongoDB and is linked to the correct user", async () => {
    const dbProf = await Profession.findById(proId);
    assert.ok(dbProf, "Professional record must exist in MongoDB Profession collection");
    assert.equal(dbProf.email, proEmail);
    assert.equal(dbProf.name, "David Carpenter Master");
    assert.equal(dbProf.isApproved, "pending", "Newly registered profile must start in pending approval status");
    assert.equal(dbProf.isActive, true, "Profile should be active by default");
  });

  test("4. Confirm an unapproved profile remains hidden from customers when approval is required", async () => {
    // Directory check
    const dirRes = await fetch(`${BASE_URL}/api/v1/professionals`);
    const dirData = await dirRes.json();
    assert.equal(dirRes.status, 200);
    const foundInList = dirData.data.some((p) => p._id === proId.toString());
    assert.equal(foundInList, false, "Unapproved professional must NOT appear in public directory");

    // Public single detail check (must be 404)
    const detailRes = await fetch(`${BASE_URL}/api/v1/professionals/${proId}`);
    assert.equal(detailRes.status, 404, "Unapproved professional must return 404 on public detail route");
  });

  test("5. Log in as admin and approve and activate the professional", async () => {
    // Admin checks list and finds the professional with pending status
    const adminListRes = await fetch(`${BASE_URL}/api/v1/admin/professionals?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert.equal(adminListRes.status, 200);
    const foundPending = adminListData.data.some((p) => p._id === proId.toString());
    assert.ok(foundPending, "Pending professional should appear in admin pending filter list");

    // Admin approves the professional
    const approveRes = await fetch(`${BASE_URL}/api/v1/admin/professionals/${proId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isApproved: "approved", isActive: true }),
    });
    const approveData = await approveRes.json();
    assert.equal(approveRes.status, 200);
    assert.equal(approveData.success, true);
    assert.equal(approveData.data.isApproved, "approved");
    assert.equal(approveData.data.isActive, true);

    // Verify in DB
    const dbProf = await Profession.findById(proId);
    assert.equal(dbProf.isApproved, "approved");
  });

  test("6. Log in as a customer and open the Professionals section", async () => {
    // Customer login check
    const custLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customerUser.email,
        password: "AdminPass123!",
        role: "customer",
      }),
    });
    assert.equal(custLoginRes.status, 200);

    // Fetch customer-facing professionals directory
    const pubRes = await fetch(`${BASE_URL}/api/v1/professionals`);
    const pubData = await pubRes.json();
    assert.equal(pubRes.status, 200);
    assert.ok(Array.isArray(pubData.data));
  });

  test("7. Confirm the approved professional appears", async () => {
    const dirRes = await fetch(`${BASE_URL}/api/v1/professionals`);
    const dirData = await dirRes.json();
    assert.equal(dirRes.status, 200);

    const proCard = dirData.data.find((p) => p._id === proId.toString());
    assert.ok(proCard, "Approved professional must appear in customer-facing Professionals section");
    assert.equal(proCard.name, "David Carpenter Master");
    assert.equal(proCard.specialization, "Carpenter");
    assert.ok(proCard.services.length >= 1);
  });

  test("8. Test service-category filtering and search", async () => {
    // Category filter: Carpenter
    const catRes = await fetch(`${BASE_URL}/api/v1/professionals?category=Carpenter`);
    const catData = await catRes.json();
    assert.equal(catRes.status, 200);
    const foundInCat = catData.data.some((p) => p._id === proId.toString());
    assert.ok(foundInCat, "Professional should be returned when filtering by Carpenter category");

    // Search query: David
    const searchRes = await fetch(`${BASE_URL}/api/v1/professionals?query=David`);
    const searchData = await searchRes.json();
    assert.equal(searchRes.status, 200);
    const foundInSearch = searchData.data.some((p) => p._id === proId.toString());
    assert.ok(foundInSearch, "Professional should be returned when searching for David");

    // Non-matching category: Electrician
    const nonMatchRes = await fetch(`${BASE_URL}/api/v1/professionals?category=Electrician`);
    const nonMatchData = await nonMatchRes.json();
    assert.equal(nonMatchRes.status, 200);
    const foundInNonMatch = nonMatchData.data.some((p) => p._id === proId.toString());
    assert.equal(foundInNonMatch, false, "Professional should NOT be returned for unrelated trade category");
  });

  test("9. Refresh the page and verify the profile remains visible", async () => {
    // Single public detail endpoint
    const detailRes = await fetch(`${BASE_URL}/api/v1/professionals/${proId}`);
    const detailData = await detailRes.json();
    assert.equal(detailRes.status, 200);
    assert.equal(detailData.success, true);
    assert.equal(detailData.data.name, "David Carpenter Master");
    assert.equal(detailData.data.isApproved, "approved");
    assert.equal(detailData.data.services[0].name, catalogService.name);
  });

  test("10. Confirm other professionals, authentication, bookings, and admin functionality still work", async () => {
    // 10.1 Admin dashboard stats
    const statsRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(statsRes.status, 200);

    // 10.2 Services catalog
    const svcRes = await fetch(`${BASE_URL}/api/v1/services`);
    assert.equal(svcRes.status, 200);

    // 10.3 Professional profile/me endpoint returns updated profile and appointments
    const meRes = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      headers: { Authorization: `Bearer ${proToken}` },
    });
    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.equal(meData.data.name, "David Carpenter Master");
    assert.equal(meData.data.isApproved, "approved");
  });
});
