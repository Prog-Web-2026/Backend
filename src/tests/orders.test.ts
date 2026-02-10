import request from "supertest";
import { app } from "../app";
import { Order } from "../models/OrderModel";
import { Product } from "../models/ProductModel";
import { UserRole } from "../models/UserModel";

describe("Order Controller E2E Tests - Fluxo Completo", () => {
  let customerToken: string;
  let adminToken: string;
  let deliveryToken: string;
  let orderId: number;
  let cartItemIds: number[] = [];
  let originalStockProduct1: number;
  let originalStockProduct2: number;

  beforeAll(async () => {
    customerToken = await getAuthToken(global.testCustomer);
    adminToken = await getAuthToken(global.testAdmin);
    deliveryToken = await getAuthToken(global.testDelivery);

    const product1 = await Product.findByPk(global.testProduct1.id);
    const product2 = await Product.findByPk(global.testProduct2.id);
    originalStockProduct1 = product1!.stock;
    originalStockProduct2 = product2!.stock;
  });

  beforeEach(async () => {
    // Reset product stock
    await Product.update(
      { stock: originalStockProduct1 },
      { where: { id: global.testProduct1.id } }
    );
    await Product.update(
      { stock: originalStockProduct2 },
      { where: { id: global.testProduct2.id } }
    );

    const item1 = await request(app)
      .post("/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: global.testProduct1.id,
        quantity: 2,
      });

    const item2 = await request(app)
      .post("/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: global.testProduct2.id,
        quantity: 1,
      });

    cartItemIds = [item1.body.cartItem.id, item2.body.cartItem.id];
  });

  afterEach(async () => {
    const Cart = (await import("../models/CartModel")).Cart;
    const Payment = (await import("../models/PaymentModel")).Payment;
    const OrderItem = (await import("../models/OrderItemModel")).OrderItem;

    await Cart.destroy({ where: { userId: global.testCustomer.id } });
    await Payment.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    cartItemIds = [];
  });

  describe("Fluxo Completo de Compra", () => {
    it("deve completar fluxo de compra completo", async () => {
      const createOrderResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
          notes: "Entrega rápida, por favor",
        });

      expect(createOrderResponse.status).toBe(201);
      expect(createOrderResponse.body.order).toHaveProperty("id");
      expect(createOrderResponse.body.order.status).toBe("pending");

      orderId = createOrderResponse.body.order.id;

      const product1After = await Product.findByPk(global.testProduct1.id);
      const product2After = await Product.findByPk(global.testProduct2.id);

      expect(product1After!.stock).toBe(originalStockProduct1 - 2);
      expect(product2After!.stock).toBe(originalStockProduct2 - 1);

      const cartResponse = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cartResponse.body.cart.items).toHaveLength(0);

      const paymentResponse = await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "credit_card",
        });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.payment.status).toBe("success");

      const orderAfterPayment = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(orderAfterPayment.body.order.status).toBe("confirmed");

      const preparingResponse = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "preparing",
        });

      expect(preparingResponse.status).toBe(200);
      expect(preparingResponse.body.order.status).toBe("preparing");

      const readyResponse = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "ready_for_pickup",
        });

      expect(readyResponse.status).toBe(200);
      expect(readyResponse.body.order.status).toBe("ready_for_pickup");

      const userOrdersResponse = await request(app)
        .get("/orders/my-orders")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(userOrdersResponse.status).toBe(200);
      expect(userOrdersResponse.body.orders.length).toBeGreaterThan(0);
      expect(userOrdersResponse.body.orders[0].id).toBe(orderId);

      const statsResponse = await request(app)
        .get("/orders/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats).toHaveProperty("total");
      expect(statsResponse.body.stats).toHaveProperty("confirmed");
      expect(statsResponse.body.stats).toHaveProperty("preparing");
    });

    it("deve permitir cancelamento de pedido pendente", async () => {
      const createOrderResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createOrderResponse.body.order.id;

      const cancelResponse = await request(app)
        .patch(`/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.order.status).toBe("cancelled");

      const product1After = await Product.findByPk(global.testProduct1.id);
      const product2After = await Product.findByPk(global.testProduct2.id);

      expect(product1After!.stock).toBe(originalStockProduct1);
      expect(product2After!.stock).toBe(originalStockProduct2);
    });

    it("não deve permitir cancelamento de pedido após preparação", async () => {
      const createOrderResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createOrderResponse.body.order.id;

      await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "credit_card",
        });

      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "preparing",
        });

      const cancelResponse = await request(app)
        .patch(`/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(403);
    });
  });

  describe("GET /orders/:id", () => {
    it("cliente deve ver próprio pedido", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      const response = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.order.id).toBe(orderId);
      expect(response.body.order.userId).toBe(global.testCustomer.id);
      expect(response.body.order.items).toHaveLength(2);
    });

    it("admin deve ver qualquer pedido", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      const response = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.order.id).toBe(orderId);
    });

    it("cliente não deve ver pedido de outro cliente", async () => {
      const User = (await import("../models/UserModel")).User;
      const anotherCustomer = await User.create({
        name: "Outro Cliente",
        email: "outro.cliente@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.CUSTOMER,
        isActive: true,
        address: {
          street: "Rua Teste",
          number: "123",
          neighborhood: "Bairro Teste",
          city: "Cidade Teste",
          state: "TS",
          zipCode: "12345678",
          latitude: -23.5505,
          longitude: -46.6333,
        },
      });

      const anotherToken = await getAuthToken(anotherCustomer);

      const item = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          productId: global.testProduct1.id,
          quantity: 1,
        });

      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          selectedCartItemIds: [item.body.cartItem.id],
        });

      const anotherOrderId = createResponse.body.order.id;

      const response = await request(app)
        .get(`/orders/${anotherOrderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);

      // Cleanup: remove user's cart, orderItem, order, then user
      const Cart = (await import("../models/CartModel")).Cart;
      const OrderItem = (await import("../models/OrderItemModel")).OrderItem;
      const Payment = (await import("../models/PaymentModel")).Payment;
      await Cart.destroy({ where: { userId: anotherCustomer.id } });
      await Payment.destroy({ where: { userId: anotherCustomer.id } });
      await OrderItem.destroy({ where: {} }).catch(() => {});
      await Order.destroy({ where: { userId: anotherCustomer.id } });
      await anotherCustomer.destroy();
    });
  });

  describe("Payment Integration", () => {
    it("deve processar pagamento PIX", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      const response = await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "pix",
        });

      expect(response.status).toBe(200);
      expect(response.body.payment.type).toBe("pix");
      expect(response.body.payment.status).toBe("success");
    });

    it("deve processar pagamento com cartão de débito", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      const response = await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "debit_card",
        });

      expect(response.status).toBe(200);
      expect(response.body.payment.type).toBe("debit_card");
      expect(response.body.payment.status).toBe("success");
    });

    it("não deve processar pagamento de pedido já pago", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "credit_card",
        });

      const response = await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "pix",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Delivery Flow", () => {
    it("entregador deve ver pedidos disponíveis para entrega", async () => {
      const response = await request(app)
        .get("/orders/delivery/available")
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it("entregador deve aceitar pedido pronto para entrega", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      // Pagar o pedido
      await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "credit_card",
        });

      // Admin prepara e marca pronto
      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "preparing" });

      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ready_for_pickup" });

      // Entregador aceita
      const acceptResponse = await request(app)
        .post(`/orders/delivery/${orderId}/accept`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.order.status).toBe("out_for_delivery");
      expect(acceptResponse.body.order.deliveryId).toBe(global.testDelivery.id);
    });

    it("entregador deve marcar pedido como entregue", async () => {
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      // Pagar, preparar, marcar pronto e aceitar entrega
      await request(app)
        .post(`/orders/${orderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ type: "credit_card" });

      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "preparing" });

      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ready_for_pickup" });

      await request(app)
        .post(`/orders/delivery/${orderId}/accept`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      // Marcar como entregue
      const deliveredResponse = await request(app)
        .patch(`/orders/delivery/${orderId}/delivered`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(deliveredResponse.status).toBe(200);
      expect(deliveredResponse.body.order.status).toBe("delivered");
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
