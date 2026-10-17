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

const BASE_URL = `http://localhost:${process.env.PORT || 8001}`;
const JWT_SECRET = process.env.JWT_SECRET || "fixup-local-development-secret";

const signToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, JWT_SECRET, { expiresIn: "1h" });
};

describe("FixUp Phase 4 — Admin Service Management and Professional Category Filtering Test Suite", () => {
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;
  let proUser;
  let proToken;

  let approvedElectrician;
  let approvedPlumber;
  let unapprovedElectrician;
  let inactivePlumber;

  before(async () => {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fixup";
    await mongoose.connect(mongoUrl);

    // Clean up any stale test fixtures
    await User.deleteMany({ email: { $regex: /@phase4-test\.com$/i } });
    await Profession.deleteMany({ email: { $regex: /@phase4-test\.com$/i } });
    await Service.deleteMany({ name: { $regex: /^Phase4Service/i } });
    await Booking.deleteMany({ serviceAddress: { $regex: /Phase4Address/i } });

    // Fixture: Admin
    adminUser = await User.create({
      name: "Phase 4 Admin",
      email: "admin@phase4-test.com",
      password: "hashedpassword123",
      role: "admin",
    });
    adminToken = signToken(adminUser._id.toString(), "admin");

    // Fixture: Customer
    customerUser = await User.create({
      name: "Phase 4 Customer",
      email: "customer@phase4-test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    customerToken = signToken(customerUser._id.toString(), "customer");

    // Fixture: Professional User
    proUser = await Profession.create({
      name: "Phase 4 Pro Account",
      email: "pro_account@phase4-test.com",
      password: "hashedpassword123",
      specialization: "General Repair",
      ticketPrice: 500,
      role: "professional",
      isApproved: "approved",
      isActive: true,
    });
    proToken = signToken(proUser._id.toString(), "professional");

    // Fixture: Approved Active Electrician
    approvedElectrician = await Profession.create({
      name: "Phase 4 Master Electrician",
      email: "electrician_pro@phase4-test.com",
      password: "hashedpassword123",
      specialization: "Electrician",
      ticketPrice: 600,
      isApproved: "approved",
      isActive: true,
      role: "professional",
      averageRating: 4.9,
      totalRating: 5,
    });

    // Fixture: Approved Active Plumber
    approvedPlumber = await Profession.create({
      name: "Phase 4 Master Plumber",
      email: "plumber_pro@phase4-test.com",
      password: "hashedpassword123",
      specialization: "Plumber",
      ticketPrice: 550,
      isApproved: "approved",
      isActive: true,
      role: "professional",
      averageRating: 4.8,
      totalRating: 3,
    });

    // Fixture: Unapproved Electrician (Pending)
    unapprovedElectrician = await Profession.create({
      name: "Phase 4 Pending Electrician",
      email: "pending_electrician@phase4-test.com",
      password: "hashedpassword123",
      specialization: "Electrician",
      ticketPrice: 600,
      isApproved: "pending",
      isActive: true,
      role: "professional",
    });

    // Fixture: Inactive Plumber
    inactivePlumber = await Profession.create({
      name: "Phase 4 Inactive Plumber",
      email: "inactive_plumber@phase4-test.com",
      password: "hashedpassword123",
      specialization: "Plumber",
      ticketPrice: 550,
      isApproved: "approved",
      isActive: false,
      role: "professional",
    });
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@phase4-test\.com$/i } });
      await Profession.deleteMany({ email: { $regex: /@phase4-test\.com$/i } });
      await Service.deleteMany({ name: { $regex: /^Phase4Service/i } });
      await Booking.deleteMany({ serviceAddress: { $regex: /Phase4Address/i } });
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  });

  // ========================================================
  // SUITE 1: ADMIN SERVICE MANAGEMENT APIS & SECURITY
  // ========================================================
  describe("Admin Service Management", () => {
    test("1. Admin can list all services via GET /api/v1/admin/services", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.pagination);
    });

    test("2. Non-admin users cannot perform admin service operations (403 Forbidden)", async () => {
      // Customer attempt to list admin services
      const resGet = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(resGet.status, 403);

      // Customer attempt to create service
      const resPost = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: "Phase4Service Unauthorized" }),
      });
      assert.equal(resPost.status, 403);

      // Professional attempt to delete service
      const resDel = await fetch(`${BASE_URL}/api/v1/admin/services/507f1f77bcf86cd799439011`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${proToken}` },
      });
      assert.equal(resDel.status, 403);
    });

    test("3. Admin can create a new service with valid data (201 Created)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Phase4Service HVAC",
          desc: "Heating, ventilation, and air conditioning installation and maintenance",
          bgColor: "rgba(16, 185, 129, .2)",
          textColor: "#10B981",
          isActive: true,
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.data.name, "Phase4Service HVAC");
      assert.equal(data.data.isActive, true);

      // Verify in DB
      const dbService = await Service.findOne({ name: "Phase4Service HVAC" });
      assert.ok(dbService);
    });

    test("4. Invalid service data is rejected (400 Bad Request)", async () => {
      // Missing name
      const resNoName = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ desc: "No name" }),
      });
      assert.equal(resNoName.status, 400);

      // Too short name
      const resShortName = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "X" }),
      });
      assert.equal(resShortName.status, 400);
    });

    test("5. Duplicate service name is rejected (409 Conflict)", async () => {
      const resDuplicate = await fetch(`${BASE_URL}/api/v1/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "phase4service hvac", // case-insensitive duplicate check
          desc: "Duplicate test",
        }),
      });

      const data = await resDuplicate.json();
      assert.equal(resDuplicate.status, 409);
      assert.equal(data.success, false);
      assert.match(data.message, /already exists/i);
    });

    test("6. Admin can update service details (200 OK)", async () => {
      const service = await Service.findOne({ name: "Phase4Service HVAC" });
      assert.ok(service);

      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${service._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          desc: "Updated comprehensive HVAC system diagnostics and repair",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.desc, "Updated comprehensive HVAC system diagnostics and repair");
    });

    test("7. Admin can toggle service active status (200 OK)", async () => {
      const service = await Service.findOne({ name: "Phase4Service HVAC" });

      // Deactivate service
      const resDeactivate = await fetch(`${BASE_URL}/api/v1/admin/services/${service._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      const dataDeact = await resDeactivate.json();
      assert.equal(resDeactivate.status, 200);
      assert.equal(dataDeact.data.isActive, false);

      // Public API should exclude deactivated service
      const resPublic = await fetch(`${BASE_URL}/api/v1/services`);
      const dataPublic = await resPublic.json();
      const isVisible = dataPublic.data.some((s) => s.name === "Phase4Service HVAC");
      assert.equal(isVisible, false, "Deactivated service should not appear in public services list");

      // Reactivate service
      const resReactivate = await fetch(`${BASE_URL}/api/v1/admin/services/${service._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: true }),
      });
      assert.equal(resReactivate.status, 200);
    });

    test("8. Deleting a service referenced by existing bookings is blocked safely (409 Conflict)", async () => {
      // Create service
      const serviceWithBooking = await Service.create({
        name: "Phase4Service Referenced",
        desc: "Service with bookings",
        isActive: true,
      });

      // Create a booking referencing this service
      await Booking.create({
        user: customerUser._id,
        professional: approvedElectrician._id,
        service: serviceWithBooking._id,
        serviceName: "Phase4Service Referenced",
        appointmentDate: new Date("2026-12-10"),
        timeSlot: "09:00 AM - 11:00 AM",
        serviceAddress: "Phase4Address 201, Test Street",
        ticketPrice: "600",
        status: "approved",
      });

      // Attempt to hard-delete service
      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${serviceWithBooking._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      assert.equal(res.status, 409);
      assert.equal(data.success, false);
      assert.match(data.message, /referenced by \d+ existing booking/i);

      // Service should still exist in database
      const dbService = await Service.findById(serviceWithBooking._id);
      assert.ok(dbService, "Referenced service should NOT be deleted");
    });

    test("9. Admin can delete an unreferenced service (200 OK)", async () => {
      const unusedService = await Service.create({
        name: "Phase4Service Unused",
        desc: "Will be deleted",
        isActive: true,
      });

      const res = await fetch(`${BASE_URL}/api/v1/admin/services/${unusedService._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.message, "Service deleted successfully");

      const dbCheck = await Service.findById(unusedService._id);
      assert.equal(dbCheck, null);
    });
  });

  // ========================================================
  // SUITE 2: PROFESSIONAL CATEGORY FILTERING
  // ========================================================
  describe("Professional Category Filtering", () => {
    test("10. Category filter returns only professionals matching the selected trade category", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals?category=Electrician`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.length > 0);

      // Every returned professional must be an electrician
      const hasElectrician = data.data.some((p) => p._id.toString() === approvedElectrician._id.toString());
      assert.ok(hasElectrician, "Approved electrician should be present");

      const hasPlumber = data.data.some((p) => p._id.toString() === approvedPlumber._id.toString());
      assert.equal(hasPlumber, false, "Plumber should NOT be included in Electrician category");
    });

    test("11. Category phrase (e.g. 'Plumbing & Repairs') matches 'Plumber' specialization", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals?category=Plumbing%20%26%20Repairs`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);

      const hasPlumber = data.data.some((p) => p._id.toString() === approvedPlumber._id.toString());
      assert.ok(hasPlumber, "Plumber should match 'Plumbing & Repairs'");

      const hasElectrician = data.data.some((p) => p._id.toString() === approvedElectrician._id.toString());
      assert.equal(hasElectrician, false, "Electrician should NOT match 'Plumbing & Repairs'");
    });

    test("12. Inactive and unapproved professionals remain hidden when category filtering is applied", async () => {
      // Query Electrician category
      const resElec = await fetch(`${BASE_URL}/api/v1/professionals?category=Electrician`);
      const dataElec = await resElec.json();
      const hasPending = dataElec.data.some((p) => p._id.toString() === unapprovedElectrician._id.toString());
      assert.equal(hasPending, false, "Pending electrician must remain hidden");

      // Query Plumber category
      const resPlumb = await fetch(`${BASE_URL}/api/v1/professionals?category=Plumber`);
      const dataPlumb = await resPlumb.json();
      const hasInactive = dataPlumb.data.some((p) => p._id.toString() === inactivePlumber._id.toString());
      assert.equal(hasInactive, false, "Inactive plumber must remain hidden");
    });

    test("13. Search query and category filter work together (AND logic)", async () => {
      // Both category 'Electrician' and name query 'Master' -> Matches approvedElectrician ("Phase 4 Master Electrician")
      const resBoth = await fetch(
        `${BASE_URL}/api/v1/professionals?category=Electrician&query=Master`
      );
      const dataBoth = await resBoth.json();
      assert.equal(resBoth.status, 200);
      const matchesMasterElec = dataBoth.data.some((p) => p._id.toString() === approvedElectrician._id.toString());
      assert.ok(matchesMasterElec, "Should match electrician with 'Master' in name");

      // Category 'Electrician' with query 'Plumber' -> 0 results
      const resMismatch = await fetch(
        `${BASE_URL}/api/v1/professionals?category=Electrician&query=Plumber`
      );
      const dataMismatch = await resMismatch.json();
      assert.equal(resMismatch.status, 200);
      assert.equal(dataMismatch.data.length, 0, "No results when search and category conflict");
    });

    test("14. Non-matching category filter returns clean empty array without errors", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/professionals?category=NonExistentSpecialtyXYZ`);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.deepEqual(data.data, []);
    });
  });
});
