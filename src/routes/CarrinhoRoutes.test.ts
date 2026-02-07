// tests/carrinho.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Carrinho Routes API Tests", () => {
  let carrinhoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /carrinhos - deve criar um carrinho", async () => {
    const res = await request(app).post("/carrinhos").send({
      id_cliente: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_carrinho");
    expect(res.body).toHaveProperty("id_cliente", 1);

    carrinhoId = res.body.id_carrinho;
  });

  it("GET /carrinhos - deve listar todos os carrinhos", async () => {
    const res = await request(app).get("/carrinhos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /carrinhos/:id - deve buscar carrinho por id", async () => {
    const res = await request(app).get(`/carrinhos/${carrinhoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_carrinho", carrinhoId);
    expect(res.body).toHaveProperty("id_cliente", 1);
  });

  it("GET /carrinhos/:id - deve retornar 404 se carrinho não existir", async () => {
    const res = await request(app).get("/carrinhos/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Carrinho não encontrado");
  });

  it("PUT /carrinhos/:id - deve atualizar um carrinho", async () => {
    const res = await request(app).put(`/carrinhos/${carrinhoId}`).send({
      id_cliente: 2,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_carrinho", carrinhoId);
    expect(res.body).toHaveProperty("id_cliente", 2);
  });

  it("PUT /carrinhos/:id - deve retornar 404 se carrinho não existir", async () => {
    const res = await request(app).put("/carrinhos/9999").send({
      id_cliente: 2,
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Carrinho não encontrado");
  });

  it("DELETE /carrinhos/:id - deve deletar um carrinho", async () => {
    const res = await request(app).delete(`/carrinhos/${carrinhoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Carrinho deletado com sucesso");
  });

  it("DELETE /carrinhos/:id - deve retornar 404 se carrinho não existir", async () => {
    const res = await request(app).delete(`/carrinhos/${carrinhoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Carrinho não encontrado");
  });

  it("GET /carrinhos/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/carrinhos/${carrinhoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Carrinho não encontrado");
  });
});
