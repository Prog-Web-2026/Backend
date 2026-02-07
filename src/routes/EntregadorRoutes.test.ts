// tests/entregador.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Entregador Routes API Tests", () => {
  let entregadorId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /entregadores - deve criar um entregador", async () => {
    const res = await request(app).post("/entregadores").send({
      nome: "João Silva",
      cpf: "12345678900",
      telefone: "11999999999",
      placa_veiculo: "ABC1234",
      tipo_veiculo: "moto",
      status: "disponivel",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_entregador");
    expect(res.body).toHaveProperty("nome", "João Silva");
    expect(res.body).toHaveProperty("cpf", "12345678900");
    expect(res.body).toHaveProperty("telefone", "11999999999");
    expect(res.body).toHaveProperty("placa_veiculo", "ABC1234");
    expect(res.body).toHaveProperty("tipo_veiculo", "moto");
    expect(res.body).toHaveProperty("status", "disponivel");

    entregadorId = res.body.id_entregador;
  });

  it("GET /entregadores - deve listar todos os entregadores", async () => {
    const res = await request(app).get("/entregadores");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /entregadores/:id - deve buscar entregador por id", async () => {
    const res = await request(app).get(`/entregadores/${entregadorId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_entregador", entregadorId);
    expect(res.body).toHaveProperty("nome", "João Silva");
  });

  it("GET /entregadores/:id - deve retornar 404 se entregador não existir", async () => {
    const res = await request(app).get("/entregadores/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entregador não encontrado");
  });

  it("PUT /entregadores/:id - deve atualizar um entregador", async () => {
    const res = await request(app).put(`/entregadores/${entregadorId}`).send({
      nome: "João Atualizado",
      status: "em_entrega",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_entregador", entregadorId);
    expect(res.body).toHaveProperty("nome", "João Atualizado");
    expect(res.body).toHaveProperty("status", "em_entrega");
  });

  it("PUT /entregadores/:id - deve retornar 404 se entregador não existir", async () => {
    const res = await request(app).put("/entregadores/9999").send({
      nome: "Inexistente",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entregador não encontrado");
  });

  it("DELETE /entregadores/:id - deve deletar um entregador", async () => {
    const res = await request(app).delete(`/entregadores/${entregadorId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Entregador deletado com sucesso",
    );
  });

  it("DELETE /entregadores/:id - deve retornar 404 se entregador não existir", async () => {
    const res = await request(app).delete(`/entregadores/${entregadorId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entregador não encontrado");
  });

  it("GET /entregadores/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/entregadores/${entregadorId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Entregador não encontrado");
  });
});
