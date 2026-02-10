import request from "supertest";
import { app } from "../app";
import { Order } from "../models/OrderModel";
import { Payment, PaymentStatus } from "../models/PaymentModel";
import { UserRole } from "../models/UserModel";

describe("Payment Controller E2E Tests", () => {
  let customerToken: string;
  let adminToken: string;
  let orderId: number;
  let paymentId: number;

  beforeAll(async () => {
    customerToken = await getAuthToken(global.testCustomer);
    adminToken = await getAuthToken(global.testAdmin);
  });

  beforeEach(async () => {
    const item = await request(app)
      .post("/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: global.testProduct1.id,
        quantity: 1,
      });

    const orderResponse = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        selectedCartItemIds: [item.body.cartItem.id],
      });

    orderId = orderResponse.body.order.id;

    const paymentResponse = await request(app)
      .post(`/orders/${orderId}/payment`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        type: "credit_card",
      });

    paymentId = paymentResponse.body.payment.id;
  });

  afterEach(async () => {
    const Cart = (await import("../models/CartModel")).Cart;
    const OrderItem = (await import("../models/OrderItemModel")).OrderItem;
    await Cart.destroy({ where: { userId: global.testCustomer.id } });
    await Payment.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
  });

  describe("GET /payments/:id", () => {
    it("cliente deve ver próprio pagamento", async () => {
      const response = await request(app)
        .get(`/payments/${paymentId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment.id).toBe(paymentId);
      expect(response.body.payment.orderId).toBe(orderId);
      expect(response.body.payment.status).toBe("success");
    });

    it("admin deve ver qualquer pagamento", async () => {
      const response = await request(app)
        .get(`/payments/${paymentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment.id).toBe(paymentId);
    });

    it("cliente não deve ver pagamento de outro cliente", async () => {
      const User = (await import("../models/UserModel")).User;
      const anotherCustomer = await User.create({
        name: "Outro Cliente Pagamento",
        email: "outro.pagamento@example.com",
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
          productId: global.testProduct2.id,
          quantity: 1,
        });

      const orderRes = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          selectedCartItemIds: [item.body.cartItem.id],
        });

      const paymentRes = await request(app)
        .post(`/orders/${orderRes.body.order.id}/payment`)
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          type: "pix",
        });

      const anotherPaymentId = paymentRes.body.payment.id;

      const response = await request(app)
        .get(`/payments/${anotherPaymentId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);

      // Cleanup: remove user's related data
      const Cart = (await import("../models/CartModel")).Cart;
      const OrderItem = (await import("../models/OrderItemModel")).OrderItem;
      const userOrders = await Order.findAll({
        where: { userId: anotherCustomer.id },
      });
      const orderIds = userOrders.map((o) => o.id);
      await Cart.destroy({ where: { userId: anotherCustomer.id } });
      await Payment.destroy({ where: { userId: anotherCustomer.id } });
      if (orderIds.length > 0) {
        await OrderItem.destroy({ where: { orderId: orderIds } });
      }
      await Order.destroy({ where: { userId: anotherCustomer.id } });
      await anotherCustomer.destroy();
    });
  });

  describe("GET /payments/order/:orderId", () => {
    it("deve retornar pagamento pelo ID do pedido", async () => {
      const response = await request(app)
        .get(`/payments/order/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment.orderId).toBe(orderId);
    });

    it("deve retornar 404 para pedido sem pagamento", async () => {
      const item = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productId: global.testProduct2.id,
          quantity: 1,
        });

      const orderRes = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: [item.body.cartItem.id],
        });

      const newOrderId = orderRes.body.order.id;

      const response = await request(app)
        .get(`/payments/order/${newOrderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /payments/my-payments", () => {
    it("cliente deve ver seus próprios pagamentos", async () => {
      const response = await request(app)
        .get("/payments/my-payments")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);
      expect(response.body.payments[0].userId).toBe(global.testCustomer.id);
    });

    it("entregador não deve ver pagamentos", async () => {
      const deliveryToken = await getAuthToken(global.testDelivery);

      const response = await request(app)
        .get("/payments/my-payments")
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /payments/:id/refund (Admin only)", () => {
    it("admin deve estornar pagamento", async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.payment.status).toBe("refunded");
    });

    it("não deve estornar pagamento já estornado", async () => {
      await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      expect(response.status).toBe(400);
    });

    it("cliente não deve estornar pagamento", async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send();

      expect(response.status).toBe(403);
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
