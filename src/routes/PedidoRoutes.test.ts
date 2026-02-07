// src/routes/PedidoRoutes.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Pedido Routes API Tests", () => {
  let pedidoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /pedidos - deve criar um pedido", async () => {
    const res = await request(app).post("/pedidos").send({
      id_cliente: 1,
      id_endereco_entrega: 1,
      status: "aguardando_pagamento",
      total: 250.5,
    });

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("id_pedido");
    expect(res.body).toHaveProperty("id_cliente", 1);
    expect(res.body).toHaveProperty("id_endereco_entrega", 1);
    expect(res.body).toHaveProperty("status", "aguardando_pagamento");
    expect(res.body).toHaveProperty("total");

    pedidoId = res.body.id_pedido;
  });

  it("GET /pedidos - deve listar todos os pedidos", async () => {
    const res = await request(app).get("/pedidos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /pedidos/:id - deve buscar pedido por id", async () => {
    const res = await request(app).get(`/pedidos/${pedidoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_pedido", pedidoId);
    expect(res.body).toHaveProperty("status", "aguardando_pagamento");
  });

  it("GET /pedidos/:id - deve retornar 404 se pedido não existir", async () => {
    const res = await request(app).get("/pedidos/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pedido não encontrado");
  });

  it("PUT /pedidos/:id - deve atualizar um pedido", async () => {
    const res = await request(app).put(`/pedidos/${pedidoId}`).send({
      status: "pago",
      total: 300.0,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_pedido", pedidoId);
    expect(res.body).toHaveProperty("status", "pago");
    expect(res.body).toHaveProperty("total");
  });

  it("PUT /pedidos/:id - deve retornar 404 se pedido não existir", async () => {
    const res = await request(app).put("/pedidos/9999").send({
      status: "cancelado",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pedido não encontrado");
  });

  it("DELETE /pedidos/:id - deve deletar um pedido", async () => {
    const res = await request(app).delete(`/pedidos/${pedidoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Pedido deletado com sucesso");
  });

  it("DELETE /pedidos/:id - deve retornar 404 se pedido não existir", async () => {
    const res = await request(app).delete(`/pedidos/${pedidoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pedido não encontrado");
  });

  it("GET /pedidos/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/pedidos/${pedidoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pedido não encontrado");
  });
});
