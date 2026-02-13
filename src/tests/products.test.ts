import request from "supertest";
import { app } from "../app";
import { Product } from "../models/ProductModel";

describe("Product Controller E2E Tests", () => {
  let newProductId: number;
  let inactiveProductId: number;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    adminToken = await global.getAuthToken(global.testAdmin);
    customerToken = await global.getAuthToken(global.testCustomer);

    const inactiveProduct = await Product.create({
      name: "Produto Inativo Teste",
      description: "Produto para testar filtro inativo",
      price: 999.99,
      stock: 0,
      categoryId: global.testCategory.id,
      isActive: false,
    });

    inactiveProductId = inactiveProduct.id;
  });

  afterAll(async () => {
    if (inactiveProductId) {
      const product = await Product.findByPk(inactiveProductId);
      if (product) await product.destroy({ force: true });
    }

    if (newProductId) {
      const product = await Product.findByPk(newProductId);
      if (product) await product.destroy({ force: true });
    }
  });

  describe("GET /products", () => {
    it("should list all active products when no filters applied", async () => {
      const response = await request(app).get("/products");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((p: any) => p.isActive === true)).toBe(true);
    });

    it("should filter products by category when categoryId is provided", async () => {
      const response = await request(app).get(
        `/products?categoryId=${global.testCategory.id}`,
      );

      expect(response.status).toBe(200);
      expect(
        response.body.every(
          (p: any) => p.categoryId === global.testCategory.id,
        ),
      ).toBe(true);
    });

    it("should filter products by minimum price when minPrice is provided", async () => {
      const response = await request(app).get("/products?minPrice=3000");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.price >= 3000)).toBe(true);
    });

    it("should filter products by maximum price when maxPrice is provided", async () => {
      const response = await request(app).get("/products?maxPrice=2000");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.price <= 2000)).toBe(true);
    });

    it("should filter in-stock products when inStock is true", async () => {
      const response = await request(app).get("/products?inStock=true");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.stock > 0)).toBe(true);
    });

    it("should filter out-of-stock products when inStock is false", async () => {
      const noStockProduct = await Product.create({
        name: "Produto Sem Estoque",
        description: "Produto sem estoque para teste",
        price: 100,
        stock: 0,
        categoryId: global.testCategory.id,
        isActive: true,
      });

      const response = await request(app).get("/products?inStock=false");

      expect(response.status).toBe(200);
      expect(response.body.some((p: any) => p.id === noStockProduct.id)).toBe(
        true,
      );

      await noStockProduct.destroy();
    });
  });

  describe("GET /products/search", () => {
    it("should find products by name when search term matches", async () => {
      const response = await request(app).get("/products/search?q=Smartphone");

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name.toLowerCase()).toContain("smartphone");
    });

    it("should find products by description when search term matches", async () => {
      const response = await request(app).get("/products/search?q=teste");

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should reject search when term is too short", async () => {
      const response = await request(app).get("/products/search?q=a");

      expect(response.status).toBe(400);
    });

    it("should return empty array when search term has no matches", async () => {
      const response = await request(app).get(
        "/products/search?q=termoQueNaoExiste",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /products/:id", () => {
    it("should return product when valid ID is provided", async () => {
      const response = await request(app).get(
        `/products/${global.testProduct1.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(global.testProduct1.id);
      expect(response.body.name).toBe("Smartphone Teste");
    });

    it("should include reviews when includeReviews is true", async () => {
      const response = await request(app).get(
        `/products/${global.testProduct1.id}?includeReviews=true`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("reviews");
      expect(response.body).toHaveProperty("ratingInfo");
    });

    it("should return 404 when product is inactive", async () => {
      const response = await request(app).get(`/products/${inactiveProductId}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when product does not exist", async () => {
      const response = await request(app).get("/products/999999");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /products (Admin only)", () => {
    it("should create product when user is admin", async () => {
      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Novo Produto Admin",
          description: "Produto criado por admin",
          price: 2999.99,
          stock: 50,
          categoryId: global.testCategory.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.product.name).toBe("Novo Produto Admin");
      expect(response.body.product.price).toBe(2999.99);

      newProductId = response.body.product.id;
    });

    it("should reject product when price is negative", async () => {
      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Produto Preço Negativo",
          description: "Produto com preço negativo",
          price: -100,
          stock: 10,
          categoryId: global.testCategory.id,
        });

      expect(response.status).toBe(400);
    });

    it("should reject product when stock is negative", async () => {
      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Produto Estoque Negativo",
          description: "Produto com estoque negativo",
          price: 100,
          stock: -5,
          categoryId: global.testCategory.id,
        });

      expect(response.status).toBe(400);
    });

    it("should return 403 when user is customer", async () => {
      const response = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "Produto Não Autorizado",
          price: 100,
          categoryId: global.testCategory.id,
        });

      expect(response.status).toBe(403);
    });

    it("should return 401 when token is missing", async () => {
      const response = await request(app).post("/products").send({
        name: "Produto Sem Token",
        price: 100,
        categoryId: global.testCategory.id,
      });

      expect(response.status).toBe(401);
    });

    it("should return 401 when token is invalid", async () => {
      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer token_invalido")
        .send({
          name: "Produto Token Inválido",
          price: 100,
          categoryId: global.testCategory.id,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /products/:id (Admin only)", () => {
    it("should update product when user is admin", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Smartphone Atualizado",
          price: 2199.99,
          description: "Descrição atualizada",
        });

      expect(response.status).toBe(200);
      expect(response.body.product.name).toBe("Smartphone Atualizado");
      expect(response.body.product.price).toBe(2199.99);
    });

    it("should return 404 when category does not exist", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId: 999999,
        });

      expect(response.status).toBe(404);
    });

    it("should return 403 when user is customer", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "Tentativa Cliente",
          price: 1,
        });

      expect(response.status).toBe(403);
    });

    it("should return 401 when token is missing", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .send({
          name: "Sem Token",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /products/:id/stock (Admin only)", () => {
    it("should add stock when admin uses add operation", async () => {
      const product = await Product.findByPk(global.testProduct1.id);
      const initialStock = product!.stock;

      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 5,
          operation: "add",
        });

      expect(response.status).toBe(200);
      expect(response.body.product.stock).toBe(initialStock + 5);
    });

    it("should subtract stock when admin uses subtract operation", async () => {
      const product = await Product.findByPk(global.testProduct1.id);
      const initialStock = product!.stock;

      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 3,
          operation: "subtract",
        });

      expect(response.status).toBe(200);
      expect(response.body.product.stock).toBe(Math.max(0, initialStock - 3));
    });

    it("should set specific stock when admin uses set operation", async () => {
      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: 100,
          operation: "set",
        });

      expect(response.status).toBe(200);
      expect(response.body.product.stock).toBe(100);
    });

    it("should reject stock update when quantity is negative", async () => {
      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: -10,
          operation: "set",
        });

      expect(response.status).toBe(400);
    });

    it("should return 403 when user is customer", async () => {
      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          quantity: 10,
          operation: "add",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /products/:id (Admin only)", () => {
    it("should deactivate product when user is admin", async () => {
      const productToDelete = await Product.create({
        name: "Produto para Deletar",
        description: "Produto que será desativado",
        price: 500,
        stock: 10,
        categoryId: global.testCategory.id,
        isActive: true,
      });

      const response = await request(app)
        .delete(`/products/${productToDelete.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const productAfter = await Product.findByPk(productToDelete.id);
      expect(productAfter!.isActive).toBe(false);

      await productAfter!.destroy({ force: true });
    });

    it("should return 403 when user is customer", async () => {
      const response = await request(app)
        .delete(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it("should return 401 when token is missing", async () => {
      const response = await request(app).delete(
        `/products/${global.testProduct1.id}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
