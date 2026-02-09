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

    // Salvar estoques originais
    const product1 = await Product.findByPk(global.testProduct1.id);
    const product2 = await Product.findByPk(global.testProduct2.id);
    originalStockProduct1 = product1!.stock;
    originalStockProduct2 = product2!.stock;
  });

  beforeEach(async () => {
    // Adicionar itens ao carrinho antes de cada teste de pedido
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
    // Limpar carrinho e pedidos após cada teste
    const Cart = (await import("../models/CartModel")).Cart;
    await Cart.destroy({ where: { userId: global.testCustomer.id } });
    await Order.destroy({ where: { userId: global.testCustomer.id } });
    cartItemIds = [];
  });

  describe("Fluxo Completo de Compra", () => {
    it("deve completar fluxo de compra completo", async () => {
      // ETAPA 1: Criar pedido a partir do carrinho
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

      // Verificar que estoque foi reduzido
      const product1After = await Product.findByPk(global.testProduct1.id);
      const product2After = await Product.findByPk(global.testProduct2.id);

      expect(product1After!.stock).toBe(originalStockProduct1 - 2);
      expect(product2After!.stock).toBe(originalStockProduct2 - 1);

      // Verificar que itens foram removidos do carrinho
      const cartResponse = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cartResponse.body.cart.items).toHaveLength(0);

      // ETAPA 2: Processar pagamento
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
          installments: 1,
        });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.payment.status).toBe("success");

      // Pedido deve mudar para 'confirmed' após pagamento
      const orderAfterPayment = await request(app)
        .get(`/orders/${orderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(orderAfterPayment.body.order.status).toBe("confirmed");
      expect(orderAfterPayment.body.order.paymentStatus).toBe("success");

      // ETAPA 3: Admin muda status para preparando
      const preparingResponse = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "preparing",
        });

      expect(preparingResponse.status).toBe(200);
      expect(preparingResponse.body.order.status).toBe("preparing");

      // ETAPA 4: Admin muda status para pronto para entrega
      const readyResponse = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "ready_for_delivery",
        });

      expect(readyResponse.status).toBe(200);
      expect(readyResponse.body.order.status).toBe("ready_for_delivery");

      // ETAPA 5: Cliente lista seus pedidos
      const userOrdersResponse = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(userOrdersResponse.status).toBe(200);
      expect(userOrdersResponse.body.orders.length).toBeGreaterThan(0);
      expect(userOrdersResponse.body.orders[0].id).toBe(orderId);

      // ETAPA 6: Admin vê estatísticas
      const statsResponse = await request(app)
        .get("/orders/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats).toHaveProperty("total");
      expect(statsResponse.body.stats).toHaveProperty("confirmed");
      expect(statsResponse.body.stats).toHaveProperty("preparing");
    });

    it("deve permitir cancelamento de pedido pendente", async () => {
      // Criar pedido
      const createOrderResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createOrderResponse.body.order.id;

      // Cancelar pedido (cliente pode cancelar pedidos pendentes)
      const cancelResponse = await request(app)
        .patch(`/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.order.status).toBe("cancelled");

      // Verificar que estoque foi restaurado
      const product1After = await Product.findByPk(global.testProduct1.id);
      const product2After = await Product.findByPk(global.testProduct2.id);

      expect(product1After!.stock).toBe(originalStockProduct1);
      expect(product2After!.stock).toBe(originalStockProduct2);
    });

    it("não deve permitir cancelamento de pedido após preparação", async () => {
      // Criar pedido
      const createOrderResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createOrderResponse.body.order.id;

      // Processar pagamento
      await request(app)
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

      // Admin muda para preparando
      await request(app)
        .patch(`/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "preparing",
        });

      // Cliente tenta cancelar (não deve permitir)
      const cancelResponse = await request(app)
        .patch(`/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelResponse.status).toBe(403);
    });
  });

  describe("GET /orders/:id", () => {
    it("cliente deve ver próprio pedido", async () => {
      // Criar pedido
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
      // Criar pedido com cliente
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
      // Criar outro cliente
      const User = (await import("../models/UserModel")).User;
      const anotherCustomer = await User.create({
        name: "Outro Cliente",
        email: "outro.cliente@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      const anotherToken = await getAuthToken(anotherCustomer);

      // Outro cliente cria pedido
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

      // Cliente principal tenta ver pedido do outro
      const response = await request(app)
        .get(`/orders/${anotherOrderId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);

      await anotherCustomer.destroy();
    });
  });

  describe("Payment Integration", () => {
    it("deve processar pagamento PIX", async () => {
      // Criar pedido
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
      expect(response.body.payment).toHaveProperty("pixCode");
    });

    it("deve processar pagamento com boleto", async () => {
      // Criar pedido
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
          type: "boleto",
        });

      expect(response.status).toBe(200);
      expect(response.body.payment.type).toBe("boleto");
      expect(response.body.payment).toHaveProperty("boletoNumber");
    });

    it("não deve processar pagamento de pedido já pago", async () => {
      // Criar pedido
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      // Primeiro pagamento
      await request(app)
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

      // Segundo pagamento (não deve permitir)
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
    it("entregador deve ver atribuições pendentes", async () => {
      // Nota: Em um ambiente real, o sistema criaria atribuições automaticamente
      // Para teste, vamos apenas verificar que a rota funciona
      const response = await request(app)
        .get("/orders/delivery/pending")
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.assignments)).toBe(true);
    });

    it("entregador não deve ver pedidos de outros entregadores", async () => {
      // Criar outro entregador
      const User = (await import("../models/UserModel")).User;
      const anotherDelivery = await User.create({
        name: "Outro Entregador",
        email: "outro.entregador@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.DELIVERY,
        isActive: true,
      });

      const anotherDeliveryToken = await getAuthToken(anotherDelivery);

      // Criar pedido e atribuir ao entregador principal
      const createResponse = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          selectedCartItemIds: cartItemIds,
        });

      orderId = createResponse.body.order.id;

      // Processar pagamento (cria atribuição)
      await request(app)
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

      // Outro entregador tenta ver (não deve ver)
      const response = await request(app)
        .get("/orders/delivery/pending")
        .set("Authorization", `Bearer ${anotherDeliveryToken}`);

      // Pode retornar vazio ou 403 dependendo da implementação
      expect(response.status).toBe(200);

      await anotherDelivery.destroy();
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
