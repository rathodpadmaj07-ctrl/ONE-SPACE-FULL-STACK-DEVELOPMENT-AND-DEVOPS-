import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app.js";

test("GET /api/health returns a healthy response", async () => {
  const response = await request(app)
    .get("/api/health")
    .expect(200);

  assert.deepStrictEqual(response.body, {
    success: true,
    message: "OneSpace API is running"
  });
});

test("unknown API route returns 404", async () => {
  const response = await request(app)
    .get("/api/does-not-exist")
    .expect(404);

  assert.deepStrictEqual(response.body, {
    success: false,
    message: "Route not found"
  });
});
