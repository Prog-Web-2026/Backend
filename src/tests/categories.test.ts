import request from "supertest";
import { app } from "../app";
import { Category } from "../models/CategoryModel";

describe("Category Controller E2E Tests", () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    adminToken = await getAuthToken(global.testAdmin);
    customerToken = await getAuthToken(global.testCustomer);
  });

  describe("GET /categories", () => {
    it("should list all active categories", async () => {
      const response = await request(app).get("/categories");

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });

  describe("GET /categories/:id", () => {
    it("should return a category by id", async () => {
      const response = await request(app).get(
        `/categories/${global.testCategory.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe("Eletrônicos");
    });
  });

  describe("POST /categories", () => {
    it("should create a category when user is admin", async () => {
      const response = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Roupas",
          description: "Vestuário em geral",
        });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe("Roupas");

      await Category.destroy({ where: { id: response.body.category.id } });
    });

    it("should reject creation when user is customer", async () => {
      const response = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "Roupas",
        });

      expect(response.status).toBe(403);
    });

    it("should reject creation when name is missing", async () => {
      const response = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          description: "Sem nome",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("name");
    });

    it("should reject creation when name is too short", async () => {
      const response = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "A",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("name");
    });
  });

  describe("PUT /categories/:id", () => {
    it("should update a category when user is admin", async () => {
      const cat = await Category.create({
        name: "Para Atualizar",
        isActive: true,
      });

      const response = await request(app)
        .put(`/categories/${cat.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Atualizada",
        });

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe("Atualizada");

      await Category.destroy({ where: { id: cat.id } });
    });

    it("should reject update when name is too short", async () => {
      const response = await request(app)
        .put(`/categories/${global.testCategory.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "A",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("name");
    });
  });

  describe("PATCH /categories/:id/status", () => {
    it("should toggle category status when user is admin", async () => {
      const cat = await Category.create({
        name: "Para Toggle",
        isActive: true,
      });

      const response = await request(app)
        .patch(`/categories/${cat.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("desativada");

      await Category.destroy({ where: { id: cat.id } });
    });

    it("should reject toggle when isActive is missing", async () => {
      const response = await request(app)
        .patch(`/categories/${global.testCategory.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("isActive");
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should reject deletion when category has active products", async () => {
      const response = await request(app)
        .delete(`/categories/${global.testCategory.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
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
