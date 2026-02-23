import request from "supertest";
import { app } from "../app";

describe("Product Review Controller E2E Tests", () => {
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    customerToken = await getAuthToken(global.testCustomer);
    adminToken = await getAuthToken(global.testAdmin);
  });

  describe("POST /reviews/product/:productId - Validation", () => {
    it("should reject review when rating is missing", async () => {
      const response = await request(app)
        .post(`/reviews/product/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          comment: "Sem rating",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("rating");
    });

    it("should reject review when rating is too high", async () => {
      const response = await request(app)
        .post(`/reviews/product/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 6,
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("rating");
    });

    it("should reject review when rating is too low", async () => {
      const response = await request(app)
        .post(`/reviews/product/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("rating");
    });

    it("should reject review when rating is not an integer", async () => {
      const response = await request(app)
        .post(`/reviews/product/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 3.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("rating");
    });
  });

  describe("PUT /reviews/:id - Validation", () => {
    it("should reject update when rating is out of range", async () => {
      const response = await request(app)
        .put("/reviews/9999")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("rating");
    });
  });

  describe("POST /reviews/:id/report - Validation", () => {
    it("should reject report when details are missing", async () => {
      const response = await request(app)
        .post("/reviews/9999/report")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("details");
    });

    it("should reject report when details are too short", async () => {
      const response = await request(app)
        .post("/reviews/9999/report")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          details: "abc",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("details");
    });
  });

  describe("PATCH /reviews/admin/:id/status - Validation", () => {
    it("should reject toggle when isActive is missing", async () => {
      const response = await request(app)
        .patch("/reviews/admin/9999/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("isActive");
    });
  });
});

async function getAuthToken(user: any) {
  return global.authService.generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
