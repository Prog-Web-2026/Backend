import request from "supertest";
import { app } from "../app";
import { Cart } from "../models/CartModel";
import { Product } from "../models/ProductModel";

describe("Cart Controller E2E Tests", () => {
  let customerToken: string;
  let productLowStockId: number;

  beforeAll(async () => {
    customerToken = await getAuthToken(global.testCustomer);

    const productLowStock = await Product.create({
      name: "Produto Estoque Baixo",
      description: "Produto com pouco estoque",
      price: 99.99,
      stock: 2,
      categoryId: global.testCategory.id,
      isActive: true,
    });

    productLowStockId = productLowStock.id;
  });

  afterEach(async () => {
    await Cart.destroy({ where: { userId: global.testCustomer.id } });
  });

  afterAll(async () => {
    await Product.destroy({
      where: { id: productLowStockId },
      force: true,
    });
  });

  describe("POST /cart", () => {
    it("should add product to cart when valid", async () => {
      const response = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body.cartItem.productId).toBe(global.testProduct1.id);
      expect(response.body.cartItem.quantity).toBe(1);
    });

    it("should increase quantity when product already in cart", async () => {
      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 1 });

      const response = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 2 });

      expect(response.status).toBe(201);
      expect(response.body.cartItem.quantity).toBe(3);
    });

    it("should fail to add product when stock insufficient", async () => {
      const response = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: productLowStockId, quantity: 5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Estoque insuficiente");
    });

    it("should fail to add product when inactive", async () => {
      const inactiveProduct = await Product.create({
        name: "Produto Inativo Carrinho",
        description: "Produto inativo",
        price: 100,
        stock: 10,
        categoryId: global.testCategory.id,
        isActive: false,
      });

      try {
        const response = await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${customerToken}`)
          .send({ productId: inactiveProduct.id, quantity: 1 });

        expect(response.status).toBe(404);
      } finally {
        await inactiveProduct.destroy({ force: true });
      }
    });

    it("should fail to add product when quantity zero or negative", async () => {
      const response = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 0 });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /cart", () => {
    it("should return cart with total when items exist", async () => {
      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 2 });

      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 1 });

      const response = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(2);
      expect(response.body.cart.subtotal).toBeCloseTo(3999.98 + 4999.99, 2);
      expect(response.body.cart.itemCount).toBe(2);
    });

    it("should return empty cart when no items", async () => {
      const response = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(0);
      expect(response.body.cart.subtotal).toBe(0);
    });
  });

  describe("PUT /cart/:itemId", () => {
    it("should update item quantity when valid", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      const response = await request(app)
        .put(`/cart/${itemId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.cartItem.quantity).toBe(3);
    });

    it("should fail to update when quantity exceeds stock", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: productLowStockId, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      const response = await request(app)
        .put(`/cart/${itemId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Estoque insuficiente");
    });

    it("should fail to update item of another user", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      const otherToken = await getAuthToken(global.testAdmin);
      const response = await request(app)
        .put(`/cart/${itemId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /cart/:itemId", () => {
    it("should remove item when owned by user", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      const response = await request(app)
        .delete(`/cart/${itemId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);

      const cartResponse = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cartResponse.body.cart.items).toHaveLength(0);
    });

    it("should fail to remove item of another user", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      const otherToken = await getAuthToken(global.testAdmin);
      const response = await request(app)
        .delete(`/cart/${itemId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /cart", () => {
    it("should clear entire cart", async () => {
      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 2 });

      const cartBefore = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cartBefore.body.cart.items).toHaveLength(2);

      const response = await request(app)
        .delete("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);

      const cartAfter = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cartAfter.body.cart.items).toHaveLength(0);
      expect(cartAfter.body.cart.subtotal).toBe(0);
    });
  });

  describe("GET /cart/availability", () => {
    it("should fail when items unavailable", async () => {
      const lowStockProduct = await Product.create({
        name: "Produto indisponível",
        description: "Produto para teste",
        price: 50,
        stock: 1,
        categoryId: global.testCategory.id,
        isActive: true,
      });

      try {
        await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${customerToken}`)
          .send({ productId: lowStockProduct.id, quantity: 1 });

        await lowStockProduct.update({ stock: 0 });

        const response = await request(app)
          .get("/cart/availability")
          .set("Authorization", `Bearer ${customerToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(
          /Estoque insuficiente|Produto indisponível/,
        );
      } finally {
        await Cart.destroy({
          where: {
            userId: global.testCustomer.id,
          },
        });
        await lowStockProduct.destroy({ force: true });
      }
    });
  });

  describe("GET /cart/total", () => {
    it("should calculate total correctly", async () => {
      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 2 });

      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 1 });

      const response = await request(app)
        .get("/cart/total")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total.subtotal).toBeCloseTo(3999.98 + 4999.99, 2);
      expect(response.body.total.itemCount).toBe(2);
    });
  });

  describe("POST /cart/checkout", () => {
    it("should prepare items for checkout when valid", async () => {
      const item1 = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const item2 = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct2.id, quantity: 1 });

      const cartItemIds = [item1.body.cartItem.id, item2.body.cartItem.id];

      const response = await request(app)
        .post("/cart/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ selectedCartItemIds: cartItemIds });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.subtotal).toBeCloseTo(1999.99 + 4999.99, 2);
    });

    it("should fail checkout when no items selected", async () => {
      const response = await request(app)
        .post("/cart/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ selectedCartItemIds: [] });

      expect(response.status).toBe(400);
    });

    it("should fail checkout when items unavailable", async () => {
      const addResponse = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: global.testProduct1.id, quantity: 1 });

      const itemId = addResponse.body.cartItem.id;

      await Product.update(
        { isActive: false },
        { where: { id: global.testProduct1.id } },
      );

      try {
        const response = await request(app)
          .post("/cart/checkout")
          .set("Authorization", `Bearer ${customerToken}`)
          .send({ selectedCartItemIds: [itemId] });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(
          /Produto indisponível|Estoque insuficiente/,
        );
      } finally {
        await Product.update(
          { isActive: true },
          { where: { id: global.testProduct1.id } },
        );

        await Cart.destroy({
          where: {
            userId: global.testCustomer.id,
          },
        });
      }
    });
  });
});
