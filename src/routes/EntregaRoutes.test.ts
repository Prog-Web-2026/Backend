// tests/entrega.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Entrega Routes API Tests", () => {
  let entregaId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /entregas - deve criar uma entrega", async () => {
    const res = await request(app).post("/entregas").send({
      id_pedido: 1,
      id_entregador: 2,
      status: "aguardando_retirada",
      codigo_rastreio: "ABC123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_entrega");
    expect(res.body).toHaveProperty("id_pedido", 1);
    expect(res.body).toHaveProperty("id_entregador", 2);
    expect(res.body).toHaveProperty("status", "aguardando_retirada");
    expect(res.body).toHaveProperty("codigo_rastreio", "ABC123");

    entregaId = res.body.id_entrega;
  });

  it("GET /entregas - deve listar todas as entregas", async () => {
    const res = await request(app).get("/entregas");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /entregas/:id - deve buscar entrega por id", async () => {
    const res = await request(app).get(`/entregas/${entregaId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_entrega", entregaId);
    expect(res.body).toHaveProperty("id_pedido", 1);
  });

  it("GET /entregas/:id - deve retornar 404 se entrega não existir", async () => {
    const res = await request(app).get("/entregas/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entrega não encontrada");
  });

  it("PUT /entregas/:id - deve atualizar uma entrega", async () => {
    const res = await request(app).put(`/entregas/${entregaId}`).send({
      status: "em_transporte",
      codigo_rastreio: "XYZ789",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_entrega", entregaId);
    expect(res.body).toHaveProperty("status", "em_transporte");
    expect(res.body).toHaveProperty("codigo_rastreio", "XYZ789");
  });

  it("PUT /entregas/:id - deve retornar 404 se entrega não existir", async () => {
    const res = await request(app).put("/entregas/9999").send({
      status: "entregue",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entrega não encontrada");
  });

  it("DELETE /entregas/:id - deve deletar uma entrega", async () => {
    const res = await request(app).delete(`/entregas/${entregaId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Entrega deletada com sucesso");
  });

  it("DELETE /entregas/:id - deve retornar 404 se entrega não existir", async () => {
    const res = await request(app).delete(`/entregas/${entregaId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entrega não encontrada");
  });

  it("GET /entregas/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/entregas/${entregaId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entrega não encontrada");
  });
});
