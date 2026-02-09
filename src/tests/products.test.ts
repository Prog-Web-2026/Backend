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
    it("deve listar todos os produtos ativos", async () => {
      const response = await request(app).get("/products");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((p: any) => p.isActive === true)).toBe(true);
    });

    it("deve filtrar produtos por categoria", async () => {
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

    it("deve filtrar produtos por preço mínimo", async () => {
      const response = await request(app).get("/products?minPrice=3000");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.price >= 3000)).toBe(true);
    });

    it("deve filtrar produtos por preço máximo", async () => {
      const response = await request(app).get("/products?maxPrice=2000");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.price <= 2000)).toBe(true);
    });

    it("deve filtrar produtos em estoque", async () => {
      const response = await request(app).get("/products?inStock=true");

      expect(response.status).toBe(200);
      expect(response.body.every((p: any) => p.stock > 0)).toBe(true);
    });

    it("deve filtrar produtos sem estoque", async () => {
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
    it("deve buscar produtos por termo no nome", async () => {
      const response = await request(app).get("/products/search?q=Smartphone");

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name.toLowerCase()).toContain("smartphone");
    });

    it("deve buscar produtos por termo na descrição", async () => {
      const response = await request(app).get("/products/search?q=teste");

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("não deve buscar com termo muito curto", async () => {
      const response = await request(app).get("/products/search?q=a");

      expect(response.status).toBe(400);
    });

    it("deve retornar array vazio para termo não encontrado", async () => {
      const response = await request(app).get(
        "/products/search?q=termoQueNaoExiste",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /products/:id", () => {
    it("deve retornar produto por ID", async () => {
      const response = await request(app).get(
        `/products/${global.testProduct1.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(global.testProduct1.id);
      expect(response.body.name).toBe("Smartphone Teste");
    });

    it("deve incluir avaliações quando solicitado", async () => {
      const response = await request(app).get(
        `/products/${global.testProduct1.id}?includeReviews=true`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("reviews");
      expect(response.body).toHaveProperty("ratingInfo");
    });

    it("não deve retornar produto inativo", async () => {
      const response = await request(app).get(`/products/${inactiveProductId}`);

      expect(response.status).toBe(404);
    });

    it("deve retornar 404 para produto não existente", async () => {
      const response = await request(app).get("/products/999999");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /products (Admin only)", () => {
    it("admin deve criar produto", async () => {
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

    it("não deve criar produto com preço negativo", async () => {
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

    it("não deve criar produto com estoque negativo", async () => {
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

    it("cliente não deve criar produto", async () => {
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

    it("deve retornar 401 sem token", async () => {
      const response = await request(app).post("/products").send({
        name: "Produto Sem Token",
        price: 100,
        categoryId: global.testCategory.id,
      });

      expect(response.status).toBe(401);
    });

    it("deve retornar 401 com token inválido", async () => {
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
    it("admin deve atualizar produto", async () => {
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

    it("não deve atualizar para categoria inexistente", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId: 999999,
        });

      expect(response.status).toBe(404);
    });

    it("cliente não deve atualizar produto", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "Tentativa Cliente",
          price: 1,
        });

      expect(response.status).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const response = await request(app)
        .put(`/products/${global.testProduct1.id}`)
        .send({
          name: "Sem Token",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /products/:id/stock (Admin only)", () => {
    it("admin deve adicionar estoque", async () => {
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

    it("admin deve subtrair estoque", async () => {
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

    it("admin deve definir estoque específico", async () => {
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

    it("não deve definir estoque negativo", async () => {
      const response = await request(app)
        .patch(`/products/${global.testProduct1.id}/stock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          quantity: -10,
          operation: "set",
        });

      expect(response.status).toBe(400);
    });

    it("cliente não deve atualizar estoque", async () => {
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
    it("admin deve desativar produto", async () => {
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

    it("cliente não deve deletar produto", async () => {
      const response = await request(app)
        .delete(`/products/${global.testProduct1.id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const response = await request(app).delete(
        `/products/${global.testProduct1.id}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
