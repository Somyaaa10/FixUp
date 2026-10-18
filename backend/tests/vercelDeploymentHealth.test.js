import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app, { connectDB, isAllowedOrigin } from "../index.js";
import vercelHandler from "../api/index.js";
import User from "../models/UserSchema.js";

describe("FixUp Vercel Deployment & Health Check Suite", () => {
  let server;
  const testPort = 8009;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const allowedOrigin1 = "https://fixup-frontend-zeta.vercel.app";
  const allowedOrigin2 = "https://fixup-frontend-43ppkc3mz-somyaa10s-projects.vercel.app";
  const previewOrigin = "https://fixup-frontend-pr-12.vercel.app";
  const rejectedOrigin = "https://malicious-site.com";

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });
    await User.deleteMany({ email: /@cors-test-fixup\.com$/i });
  });

  after(async () => {
    await User.deleteMany({ email: /@cors-test-fixup\.com$/i });
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

  test("7. isAllowedOrigin correctly identifies allowed, preview, and rejected origins", () => {
    assert.equal(isAllowedOrigin(allowedOrigin1), true);
    assert.equal(isAllowedOrigin(allowedOrigin2), true);
    assert.equal(isAllowedOrigin(previewOrigin), true);
    assert.equal(isAllowedOrigin("https://fixup-frontend.vercel.app"), true);
    assert.equal(isAllowedOrigin("http://localhost:5173"), true);
    assert.equal(isAllowedOrigin("http://localhost:3000"), true);
    assert.equal(isAllowedOrigin(undefined), true);
    assert.equal(isAllowedOrigin(""), true);
    assert.equal(isAllowedOrigin(rejectedOrigin), false);
    assert.equal(isAllowedOrigin("https://not-fixup-frontend.vercel.app"), false);
  });

  test("8. CORS OPTIONS preflight allows exact frontend origin 1 (fixup-frontend-zeta.vercel.app)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "OPTIONS",
      headers: {
        Origin: allowedOrigin1,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), allowedOrigin1);
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    const allowedMethods = res.headers.get("access-control-allow-methods") || "";
    assert.ok(allowedMethods.includes("POST"));
    assert.ok(allowedMethods.includes("OPTIONS"));
    const allowedHeaders = res.headers.get("access-control-allow-headers") || "";
    assert.ok(allowedHeaders.toLowerCase().includes("content-type"));
  });

  test("9. CORS OPTIONS preflight allows exact frontend origin 2 (fixup-frontend-43ppkc3mz-somyaa10s-projects.vercel.app)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "OPTIONS",
      headers: {
        Origin: allowedOrigin2,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), allowedOrigin2);
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  test("10. CORS OPTIONS preflight allows dynamic FixUp preview deployments", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "OPTIONS",
      headers: {
        Origin: previewOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), previewOrigin);
  });

  test("11. CORS rejects unauthorized origin in production with 403 Forbidden", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "OPTIONS",
        headers: {
          Origin: rejectedOrigin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.headers.get("access-control-allow-origin"), null);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /CORS policy violation/i);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  test("12. Registration POST succeeds for allowed origin with correct CORS and body", async () => {
    const testEmail = `user_${Date.now()}@cors-test-fixup.com`;
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        Origin: allowedOrigin1,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "CORS Test User",
        email: testEmail,
        password: "StrongPassword123!",
        role: "customer",
        gender: "other",
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), allowedOrigin1);
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.message, "Account created successfully");

    // Verify user was stored in MongoDB
    const createdUser = await User.findOne({ email: testEmail });
    assert.ok(createdUser);
    assert.equal(createdUser.name, "CORS Test User");
  });

  test("13. Registration POST validation error preserves CORS headers", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        Origin: allowedOrigin2,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing name, email, password
        role: "customer",
      }),
    });

    assert.equal(res.status, 400);
    assert.equal(res.headers.get("access-control-allow-origin"), allowedOrigin2);
    const data = await res.json();
    assert.equal(data.success, false);
  });
});
