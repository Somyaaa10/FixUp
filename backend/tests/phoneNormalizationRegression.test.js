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

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp — Phone Normalization & Profile Update Regression Test Suite", () => {
  const testSuffix = Date.now();

  let proUser, proToken;
  let customerUser, customerToken;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up stale fixtures
    await User.deleteMany({ email: { $regex: /@phone-norm-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phone-norm-test\.com$/i } });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("Password123!", salt);

    // Seed professional with numeric phone originally in DB (simulating legacy data)
    proUser = await Profession.create({
      name: "Phone Test Pro",
      email: `pro_${testSuffix}@phone-norm-test.com`,
      password: hashPassword,
      role: "professional",
      specialization: "Electrician",
      phone: 9876543210, // Numeric phone in MongoDB!
      ticketPrice: 500,
      isApproved: "approved",
      isActive: true,
    });
    proToken = signToken(proUser._id.toString(), "professional");

    // Seed customer
    customerUser = await User.create({
      name: "Phone Test Customer",
      email: `cust_${testSuffix}@phone-norm-test.com`,
      password: hashPassword,
      role: "customer",
      phone: 9123456780, // Numeric phone in MongoDB!
    });
    customerToken = signToken(customerUser._id.toString(), "customer");
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@phone-norm-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phone-norm-test\.com$/i } });
    await mongoose.disconnect();
  });

  test("1. Professional profile endpoint returns numeric phone gracefully without crashing", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data);
    // Even if originally numeric, accessing phone works
    assert.equal(String(body.data.phone), "9876543210");
  });

  test("2. Professional profile update accepts numeric phone and normalizes to string", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Phone Test Pro Updated",
        phone: 9876500000, // Numeric phone payload
        specialization: "Electrician",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.phone, "9876500000");

    // Verify stored type in DB is string
    const doc = await Profession.findById(proUser._id);
    assert.equal(typeof doc.phone, "string");
    assert.equal(doc.phone, "9876500000");
  });

  test("3. Professional profile update accepts formatted string with country code and whitespace", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: "  +91 98765 12345  ",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.phone, "+91 98765 12345");
  });

  test("4. Missing phone field in update payload does not overwrite existing phone", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Renamed Pro",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.name, "Renamed Pro");
    assert.equal(body.data.phone, "+91 98765 12345");
  });

  test("5. Empty or null phone value is normalized gracefully without crash", async () => {
    // 5a. null phone
    const resNull = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: null,
      }),
    });

    const bodyNull = await resNull.json();
    assert.equal(resNull.status, 200);
    assert.equal(bodyNull.data.phone, "");

    // 5b. empty string phone
    const resEmpty = await fetch(`${BASE_URL}/api/v1/professionals/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: "   ",
      }),
    });

    const bodyEmpty = await resEmpty.json();
    assert.equal(resEmpty.status, 200);
    assert.equal(bodyEmpty.data.phone, "");
  });

  test("6. Customer user profile update accepts numeric phone and normalizes to string", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/users/profile/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Customer Updated",
        phone: 9988776655, // Numeric phone
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.phone, "9988776655");

    const doc = await User.findById(customerUser._id);
    assert.equal(typeof doc.phone, "string");
    assert.equal(doc.phone, "9988776655");
  });
});
