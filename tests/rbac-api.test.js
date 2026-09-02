const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const { app, pool } = require("../server");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_in_prod";

// Generate test JWT tokens
const userToken = jwt.sign({ id: 999, username: "testuser", role: "user" }, JWT_SECRET, { expiresIn: "1h" });
const adminToken = jwt.sign({ id: 1, username: "admin", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
const managerToken = jwt.sign({ id: 2, username: "manager", role: "manager" }, JWT_SECRET, { expiresIn: "1h" });

let server;
let baseUrl;

test.before(async () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = "http://127.0.0.1:" + port;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (pool && pool.end) {
    await pool.end().catch(() => {});
  }
});

test("RBAC Backend API - /api/finances Endpoint", async (t) => {
  await t.test("GET /api/finances returns 401 Unauthorized when no token is provided", async () => {
    const res = await fetch(baseUrl + "/api/finances");
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /token required|unauthorized/i);
  });

  await t.test("GET /api/finances returns 403 Forbidden when user role is user", async () => {
    const res = await fetch(baseUrl + "/api/finances", {
      headers: { Authorization: "Bearer " + userToken },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /Insufficient permissions|Forbidden/i);
  });

  await t.test("GET /api/finances returns 200 OK with analytics for admin role", async () => {
    const res = await fetch(baseUrl + "/api/finances", {
      headers: { Authorization: "Bearer " + adminToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "success");
    assert.ok(body.summary, "Expected summary in financial response");
    assert.ok(Array.isArray(body.monthlySales), "Expected monthlySales array");
    assert.ok(Array.isArray(body.dailyTopSellers), "Expected dailyTopSellers array");
    assert.strictEqual(typeof body.summary.totalValue, "number");
  });

  await t.test("GET /api/finances returns 200 OK for manager role", async () => {
    const res = await fetch(baseUrl + "/api/finances", {
      headers: { Authorization: "Bearer " + managerToken },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "success");
  });
});

test("RBAC Backend API - /api/products Data Sanitization", async (t) => {
  await t.test("GET /api/products strips price field for user role", async () => {
    const res = await fetch(baseUrl + "/api/products", {
      headers: { Authorization: "Bearer " + userToken },
    });
    assert.strictEqual(res.status, 200);
    const products = await res.json();
    assert.ok(Array.isArray(products));
    if (products.length > 0) {
      for (const p of products) {
        assert.strictEqual(p.price, undefined, "Product " + p.name + " should not contain price for user role");
      }
    }
  });

  await t.test("GET /api/products includes price field for admin role", async () => {
    const res = await fetch(baseUrl + "/api/products", {
      headers: { Authorization: "Bearer " + adminToken },
    });
    assert.strictEqual(res.status, 200);
    const products = await res.json();
    assert.ok(Array.isArray(products));
    if (products.length > 0) {
      assert.ok(products.some((p) => p.price !== undefined), "Admin should receive price values");
    }
  });

  await t.test("GET /api/products/:id strips price field for user role", async () => {
    const listRes = await fetch(baseUrl + "/api/products", {
      headers: { Authorization: "Bearer " + adminToken },
    });
    const products = await listRes.json();
    if (products.length > 0) {
      const sampleId = products[0].product_id || products[0].id;
      const userRes = await fetch(baseUrl + "/api/products/" + sampleId, {
        headers: { Authorization: "Bearer " + userToken },
      });
      assert.strictEqual(userRes.status, 200);
      const product = await userRes.json();
      assert.strictEqual(product.price, undefined, "Single product price should be stripped for user role");

      const adminRes = await fetch(baseUrl + "/api/products/" + sampleId, {
        headers: { Authorization: "Bearer " + adminToken },
      });
      assert.strictEqual(adminRes.status, 200);
      const adminProduct = await adminRes.json();
      assert.notStrictEqual(adminProduct.price, undefined, "Single product price should be visible to admin");
    }
  });
});

test("RBAC Backend API - Product Mutation Restrictions for User Role", async (t) => {
  await t.test("POST /api/products returns 403 Forbidden for user role", async () => {
    const res = await fetch(baseUrl + "/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userToken,
      },
      body: JSON.stringify({
        sku: "TEST-SKU-999",
        name: "Restricted Product",
        quantity: 10,
        price: 99.99,
      }),
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /Forbidden|Standard users cannot/i);
  });

  await t.test("PUT /api/products/:id returns 403 Forbidden for user role", async () => {
    const res = await fetch(baseUrl + "/api/products/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userToken,
      },
      body: JSON.stringify({
        name: "Unauthorized Update",
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("DELETE /api/products/:id returns 403 Forbidden for user role", async () => {
    const res = await fetch(baseUrl + "/api/products/1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + userToken,
      },
    });
    assert.strictEqual(res.status, 403);
  });
});

test("RBAC Backend API - Public Registration Endpoint Disabled", async (t) => {
  await t.test("POST /api/auth/register returns 403 Forbidden", async () => {
    const res = await fetch(baseUrl + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "newuser",
        email: "newuser@example.com",
        password: "Password123!",
      }),
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /Public registration is disabled/i);
  });
});

test("RBAC Backend API - Settings & System Control Endpoints", async (t) => {
  await t.test("GET /api/settings strips financial & admin fields for user role", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      headers: { Authorization: "Bearer " + userToken },
    });
    assert.strictEqual(res.status, 200);
    const settings = await res.json();
    assert.strictEqual(settings.currencySymbol, undefined, "User role should not receive currencySymbol");
    assert.strictEqual(settings.cogsRatio, undefined, "User role should not receive cogsRatio");
    assert.strictEqual(settings.profitMarginTarget, undefined, "User role should not receive profitMarginTarget");
    assert.strictEqual(settings.allowDatabaseReset, undefined, "User role should not receive allowDatabaseReset");
    assert.strictEqual(settings.serverEnvironment, undefined, "User role should not receive serverEnvironment");
    assert.strictEqual(typeof settings.notificationsEnabled, "boolean");
  });

  await t.test("GET /api/settings returns full financial & admin settings for admin role", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      headers: { Authorization: "Bearer " + adminToken },
    });
    assert.strictEqual(res.status, 200);
    const settings = await res.json();
    assert.strictEqual(settings.currencySymbol, "฿");
    assert.strictEqual(settings.cogsRatio, 0.65);
    assert.strictEqual(settings.profitMarginTarget, 0.35);
    assert.strictEqual(settings.allowDatabaseReset, true);
  });

  await t.test("PUT /api/settings returns 403 when user role tries to change financial settings", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userToken,
      },
      body: JSON.stringify({
        cogsRatio: 0.90,
      }),
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /Forbidden: Standard users cannot modify financial or administrative/i);
  });

  await t.test("PUT /api/settings returns 403 when user role tries to change admin database reset settings", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userToken,
      },
      body: JSON.stringify({
        allowDatabaseReset: false,
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("PUT /api/settings allows user role to update safe personal preferences", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + userToken,
      },
      body: JSON.stringify({
        notificationsEnabled: false,
      }),
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test("PUT /api/settings allows admin role to update financial parameters", async () => {
    const res = await fetch(baseUrl + "/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + adminToken,
      },
      body: JSON.stringify({
        profitMarginTarget: 0.40,
      }),
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test("POST /api/settings/reset-database returns 403 Forbidden for user role", async () => {
    const res = await fetch(baseUrl + "/api/settings/reset-database", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + userToken,
      },
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("POST /api/settings/reset-database returns 200 OK for admin role", async () => {
    const res = await fetch(baseUrl + "/api/settings/reset-database", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + adminToken,
      },
    });
    assert.strictEqual(res.status, 200);
  });
});
