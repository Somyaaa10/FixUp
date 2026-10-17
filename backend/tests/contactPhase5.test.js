import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../models/UserSchema.js";
import Contact from "../models/ContactSchema.js";

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 5 — Contact Form Integration and Image Optimization Test Suite", () => {
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;
  let savedMessageId;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up stale test fixtures
    await User.deleteMany({ email: { $regex: /@phase5-test\.com$/i } });
    await Contact.deleteMany({ email: { $regex: /@phase5-test\.com$/i } });

    // Fixture: Admin
    adminUser = await User.create({
      name: "Phase 5 Admin",
      email: "admin@phase5-test.com",
      password: "hashedpassword123",
      role: "admin",
    });
    adminToken = signToken(adminUser._id.toString(), "admin");

    // Fixture: Customer
    customerUser = await User.create({
      name: "Phase 5 Customer",
      email: "customer@phase5-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    customerToken = signToken(customerUser._id.toString(), "customer");
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@phase5-test\.com$/i } });
    await Contact.deleteMany({ email: { $regex: /@phase5-test\.com$/i } });
    await mongoose.connection.close();
  });

  describe("1. Contact Form Backend Integration & Validations", () => {
    test("1. Successfully submits valid contact message (201 Created)", async () => {
      const payload = {
        name: "  Sarah Connor  ",
        email: "  SARAH.CONNOR@PHASE5-TEST.COM  ",
        subject: "  Inquiry regarding electrician availability  ",
        message: "Hello FixUp team, I would like to know if emergency electrical repairs can be scheduled on Sundays. Thank you!",
      };

      const res = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.ok(data.data.id, "Response should return created inquiry ID");
      assert.equal(data.data.email, "sarah.connor@phase5-test.com", "Email must be trimmed and lowercased");
      assert.equal(data.data.name, "Sarah Connor", "Name must be trimmed");
      assert.equal(data.data.subject, "Inquiry regarding electrician availability");

      savedMessageId = data.data.id;

      // Verify in DB
      const dbRecord = await Contact.findById(savedMessageId);
      assert.ok(dbRecord, "Record must exist in Contact collection");
      assert.equal(dbRecord.status, "unread");
      assert.equal(dbRecord.email, "sarah.connor@phase5-test.com");
    });

    test("2. Rejects submission with missing required fields (400 Bad Request)", async () => {
      // Missing name
      const resNoName = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "   ",
          email: "valid@phase5-test.com",
          subject: "Valid subject",
          message: "Valid message content with sufficient length.",
        }),
      });
      const dataNoName = await resNoName.json();
      assert.equal(resNoName.status, 400);
      assert.equal(dataNoName.success, false);
      assert.match(dataNoName.message, /Name is required/i);

      // Missing email
      const resNoEmail = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "",
          subject: "Valid subject",
          message: "Valid message content with sufficient length.",
        }),
      });
      const dataNoEmail = await resNoEmail.json();
      assert.equal(resNoEmail.status, 400);
      assert.match(dataNoEmail.message, /Email address is required/i);

      // Missing subject
      const resNoSubject = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@phase5-test.com",
          subject: "  ",
          message: "Valid message content with sufficient length.",
        }),
      });
      const dataNoSubject = await resNoSubject.json();
      assert.equal(resNoSubject.status, 400);
      assert.match(dataNoSubject.message, /Subject is required/i);

      // Missing message
      const resNoMsg = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@phase5-test.com",
          subject: "Valid subject",
          message: "   ",
        }),
      });
      const dataNoMsg = await resNoMsg.json();
      assert.equal(resNoMsg.status, 400);
      assert.match(dataNoMsg.message, /Message is required/i);
    });

    test("3. Rejects malformed email address (400 Bad Request)", async () => {
      const invalidEmails = [
        "not-an-email",
        "missingatsign.com",
        "user@",
        "@domain.com",
        "user@domain",
        "user name@domain.com",
      ];

      for (const badEmail of invalidEmails) {
        const res = await fetch(`${BASE_URL}/api/v1/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: badEmail,
            subject: "Testing bad email",
            message: "This is a legitimate message testing invalid email addresses.",
          }),
        });

        const data = await res.json();
        assert.equal(res.status, 400, `Expected 400 for bad email: ${badEmail}`);
        assert.equal(data.success, false);
        assert.match(data.message, /valid email/i);
      }
    });

    test("4. Rejects excessively short or long inputs (400 Bad Request)", async () => {
      // Name < 2 chars
      const resShortName = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "J",
          email: "john@phase5-test.com",
          subject: "Valid subject",
          message: "Valid message with more than ten characters.",
        }),
      });
      assert.equal(resShortName.status, 400);

      // Subject < 3 chars
      const resShortSubj = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@phase5-test.com",
          subject: "Hi",
          message: "Valid message with more than ten characters.",
        }),
      });
      assert.equal(resShortSubj.status, 400);

      // Message < 10 chars
      const resShortMsg = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@phase5-test.com",
          subject: "Valid subject",
          message: "Too short",
        }),
      });
      assert.equal(resShortMsg.status, 400);

      // Excessively long message (> 2000 chars)
      const hugeMessage = "A".repeat(2005);
      const resHugeMsg = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@phase5-test.com",
          subject: "Valid subject",
          message: hugeMessage,
        }),
      });
      assert.equal(resHugeMsg.status, 400);
      const dataHuge = await resHugeMsg.json();
      assert.match(dataHuge.message, /cannot exceed 2000 characters/i);

      // Excessively long name (> 100 chars)
      const hugeName = "N".repeat(105);
      const resHugeName = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hugeName,
          email: "john@phase5-test.com",
          subject: "Valid subject",
          message: "Valid message with more than ten characters.",
        }),
      });
      assert.equal(resHugeName.status, 400);
    });

    test("5. Rejects malformed payload types (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: { object: "invalid" },
          email: 12345,
          subject: ["array"],
          message: true,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /strings/i);
    });

    test("6. Honeypot traps bots and silently drops message without storing", async () => {
      const botPayload = {
        name: "Bot Spammer",
        email: "bot@phase5-test.com",
        subject: "Cheap SEO services",
        message: "Click here for guaranteed search ranking improvements today!",
        hp: "I am a hidden bot trap field filled by scraper",
      };

      const res = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botPayload),
      });

      const data = await res.json();
      assert.equal(res.status, 200, "Should return 200 to neutralize bot script");
      assert.equal(data.success, true);

      // Confirm bot payload was NEVER persisted
      const dbCheck = await Contact.findOne({ email: "bot@phase5-test.com" });
      assert.equal(dbCheck, null, "Bot submission must NOT be saved in database");
    });
  });

  describe("2. Contact Message Privacy & Authorization", () => {
    test("7. Unauthenticated user cannot access contact messages (401 Unauthorized)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test("8. Non-admin customer cannot access contact messages (403 Forbidden)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test("9. Authorized admin can view list of contact messages (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data), "Should return array of inquiries");
      assert.ok(data.pagination, "Should return pagination metadata");

      const found = data.data.some((m) => m._id === savedMessageId);
      assert.ok(found, "Saved message should appear in admin inquiry list");
    });

    test("10. Authorized admin can retrieve inquiry details and auto-marks as read (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${savedMessageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data._id, savedMessageId);
      assert.equal(data.data.name, "Sarah Connor");

      // Verify status updated to "read"
      const updated = await Contact.findById(savedMessageId);
      assert.equal(updated.status, "read");
    });

    test("11. Authorized admin can update message status (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${savedMessageId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, "resolved");

      const inDb = await Contact.findById(savedMessageId);
      assert.equal(inDb.status, "resolved");
    });

    test("12. Invalid status update is rejected (400 Bad Request)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${savedMessageId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "invalid_status_xyz" }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test("13. Authorized admin can delete contact message (200 OK)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/contact-messages/${savedMessageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);

      const inDb = await Contact.findById(savedMessageId);
      assert.equal(inDb, null, "Message should be deleted from database");
    });
  });

  describe("3. Image Optimization & Asset Verification", () => {
    test("14. Optimized assets exist and are under 250 KB each", () => {
      const imgDir = path.resolve(__dirname, "../../frontend/src/assets/images");
      const optimizedImages = [
        "plumber-img.jpg",
        "hero-img1.jpg",
        "painter-img.jpg",
        "electrician-img.jpg",
        "homeClean-img.jpg",
        "about.jpg",
      ];

      for (const imgName of optimizedImages) {
        const fullPath = path.join(imgDir, imgName);
        assert.ok(fs.existsSync(fullPath), `Asset ${imgName} must exist`);
        const stats = fs.statSync(fullPath);
        const sizeKB = stats.size / 1024;
        assert.ok(
          sizeKB < 250,
          `Image ${imgName} should be optimized under 250 KB (actual: ${sizeKB.toFixed(1)} KB)`
        );
      }
    });

    test("15. Frontend production build succeeds cleanly", () => {
      const distDir = path.resolve(__dirname, "../../frontend/dist");
      assert.ok(fs.existsSync(distDir), "Frontend dist directory must exist from production build");
      const indexHtml = path.join(distDir, "index.html");
      assert.ok(fs.existsSync(indexHtml), "dist/index.html must exist");
    });
  });
});
