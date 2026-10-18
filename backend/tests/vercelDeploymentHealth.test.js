import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app, { connectDB } from "../index.js";
import vercelHandler from "../api/index.js";

describe("FixUp Vercel Deployment & Health Check Suite", () => {
  let server;
  const testPort = 8009;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test("1. Express application is properly exported as default", () => {
    assert.equal(typeof app, "function");
    assert.ok(app.handle);
  });

  test("2. Vercel serverless entry point exports handler function", () => {
    assert.equal(typeof vercelHandler, "function");
  });

  test("3. Root endpoint returns API running confirmation", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, "FixUp API is running");
  });

  test("4. /api/health endpoint returns health JSON without exposing secrets", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok([200, 503].includes(res.status));
    const data = await res.json();

    assert.ok(data.status === "ok" || data.status === "degraded");
    assert.ok(data.timestamp);
    assert.ok(typeof data.uptime === "number");
    assert.ok(data.database === "connected" || data.database === "disconnected");

    // Ensure no secrets or connection strings are leaked
    const jsonStr = JSON.stringify(data);
    assert.ok(!jsonStr.includes("password"));
    assert.ok(!jsonStr.includes("mongodb+srv"));
    assert.ok(!jsonStr.includes("secret"));
    assert.ok(!jsonStr.includes("jwt"));
  });

  test("5. /health alias endpoint returns matching health JSON", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.ok([200, 503].includes(res.status));
    const data = await res.json();
    assert.ok(data.status);
    assert.ok(data.database);
  });

  test("6. createAdmin script can be safely imported without argv[1]", async () => {
    const originalArgv = [...process.argv];
    try {
      delete process.argv[1];
      const createAdminModule = await import("../scripts/createAdmin.js");
      assert.equal(typeof createAdminModule.seedAdminIfMissing, "function");
    } finally {
      process.argv = originalArgv;
    }
  });
});
