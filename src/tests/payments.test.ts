// tests/payments.e2e.test.ts
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
    // Criar pedido com pagamento para cada teste
    // Adicionar ao carrinho
    const item = await request(app)
      .post("/cart")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: global.testProduct1.id,
        quantity: 1,
      });

    // Criar pedido
    const orderResponse = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        selectedCartItemIds: [item.body.cartItem.id],
      });

    orderId = orderResponse.body.order.id;

    // Processar pagamento
    const paymentResponse = await request(app)
      .post(`/orders/${orderId}/payment`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        type: "credit_card",
        cardData: {
          cardHolderName: "TESTE TESTE",
          cardNumber: "4111111111111111",
          cardExpiryMonth: 12,
          cardExpiryYear: 2030,
          cardCvv: "123",
        },
      });

    paymentId = paymentResponse.body.payment.id;
  });

  afterEach(async () => {
    // Limpar
    const Cart = (await import("../models/CartModel")).Cart;
    await Cart.destroy({ where: { userId: global.testCustomer.id } });
    await Payment.destroy({ where: {} });
    await Order.destroy({ where: {} });
  });

  describe("GET /payments/:id", () => {
    it("cliente deve ver próprio pagamento", async () => {
      const response = await request(app)
        .get(`/payments/${paymentId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(paymentId);
      expect(response.body.orderId).toBe(orderId);
      expect(response.body.status).toBe("success");
    });

    it("admin deve ver qualquer pagamento", async () => {
      const response = await request(app)
        .get(`/payments/${paymentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(paymentId);
    });

    it("cliente não deve ver pagamento de outro cliente", async () => {
      // Criar outro cliente e seu pagamento
      const User = (await import("../models/UserModel")).User;
      const anotherCustomer = await User.create({
        name: "Outro Cliente Pagamento",
        email: "outro.pagamento@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      const anotherToken = await getAuthToken(anotherCustomer);

      // Outro cliente cria pedido e pagamento
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

      // Cliente principal tenta ver
      const response = await request(app)
        .get(`/payments/${anotherPaymentId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);

      await anotherCustomer.destroy();
    });
  });

  describe("GET /payments/order/:orderId", () => {
    it("deve retornar pagamento pelo ID do pedido", async () => {
      const response = await request(app)
        .get(`/payments/order/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orderId).toBe(orderId);
    });

    it("deve retornar 404 para pedido sem pagamento", async () => {
      // Criar pedido sem pagamento
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

  describe("GET /payments/user", () => {
    it("cliente deve ver seus próprios pagamentos", async () => {
      const response = await request(app)
        .get("/payments/user")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].userId).toBe(global.testCustomer.id);
    });

    it("admin deve ver todos os pagamentos", async () => {
      const response = await request(app)
        .get("/payments/user")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("entregador não deve ver pagamentos", async () => {
      const deliveryToken = await getAuthToken(global.testDelivery);

      const response = await request(app)
        .get("/payments/user")
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /payments/:id/refund (Admin only)", () => {
    it("admin deve estornar pagamento", async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Pedido cancelado pelo cliente",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("refunded");
      expect(response.body).toHaveProperty("refundedAt");
    });

    it("não deve estornar pagamento já estornado", async () => {
      // Primeiro estorno
      await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Teste",
        });

      // Segundo estorno (não deve permitir)
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Segundo estorno",
        });

      expect(response.status).toBe(400);
    });

    it("cliente não deve estornar pagamento", async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Cliente tentando estornar",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /payments/:id/cancel", () => {
    it("cliente deve cancelar pagamento pendente", async () => {
      // Criar pagamento pendente (boleto)
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

      const paymentRes = await request(app)
        .post(`/orders/${newOrderId}/payment`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          type: "boleto",
        });

      const pendingPaymentId = paymentRes.body.payment.id;

      // Atualizar status para pending (simulando boleto não pago)
      const PaymentModel = (await import("../models/PaymentModel")).Payment;
      await PaymentModel.update(
        { status: PaymentStatus.PENDING },
        { where: { id: pendingPaymentId } },
      );

      // Cancelar pagamento
      const response = await request(app)
        .delete(`/payments/${pendingPaymentId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("cancelled");
    });

    it("não deve cancelar pagamento já processado", async () => {
      const response = await request(app)
        .delete(`/payments/${paymentId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
    });

    it("admin deve cancelar pagamento de qualquer usuário", async () => {
      // Criar pagamento pendente com outro usuário
      const User = (await import("../models/UserModel")).User;
      const anotherCustomer = await User.create({
        name: "Cliente Cancelamento",
        email: "cancelamento@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      const anotherToken = await getAuthToken(anotherCustomer);

      const item = await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({
          productId: global.testProduct1.id,
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
          type: "boleto",
        });

      const pendingPaymentId = paymentRes.body.payment.id;

      // Admin cancela
      const response = await request(app)
        .delete(`/payments/${pendingPaymentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      await anotherCustomer.destroy();
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
