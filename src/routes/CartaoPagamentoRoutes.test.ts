// tests/cartaoPagamento.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Cartão de Pagamento Routes API Tests", () => {
  let cartaoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /cartoes-pagamento - deve criar um cartão de pagamento", async () => {
    const res = await request(app).post("/cartoes-pagamento").send({
      id_cliente: 1,
      bandeira: "Visa",
      numero_mascarado: "**** **** **** 1234",
      nome_titular: "João Silva",
      validade: "2026-12-31",
      cvv_hash: "hashed123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_cartao");
    expect(res.body).toHaveProperty("id_cliente", 1);
    expect(res.body).toHaveProperty("bandeira", "Visa");
    expect(res.body).toHaveProperty("numero_mascarado", "**** **** **** 1234");
    expect(res.body).toHaveProperty("nome_titular", "João Silva");
    expect(new Date(res.body.validade).toISOString()).toBe(
      new Date("2026-12-31").toISOString(),
    );
    expect(res.body).toHaveProperty("cvv_hash", "hashed123");

    cartaoId = res.body.id_cartao;
  });

  it("GET /cartoes-pagamento - deve listar todos os cartões", async () => {
    const res = await request(app).get("/cartoes-pagamento");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /cartoes-pagamento/:id - deve buscar cartão por id", async () => {
    const res = await request(app).get(`/cartoes-pagamento/${cartaoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_cartao", cartaoId);
    expect(res.body).toHaveProperty("nome_titular", "João Silva");
  });

  it("GET /cartoes-pagamento/:id - deve retornar 404 se cartão não existir", async () => {
    const res = await request(app).get("/cartoes-pagamento/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Cartão não encontrado");
  });

  it("PUT /cartoes-pagamento/:id - deve atualizar um cartão", async () => {
    const res = await request(app).put(`/cartoes-pagamento/${cartaoId}`).send({
      nome_titular: "João Atualizado",
      validade: "2027-12-31",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_cartao", cartaoId);
    expect(res.body).toHaveProperty("nome_titular", "João Atualizado");
    expect(new Date(res.body.validade).toISOString()).toBe(
      new Date("2027-12-31").toISOString(),
    );
  });

  it("PUT /cartoes-pagamento/:id - deve retornar 404 se cartão não existir", async () => {
    const res = await request(app).put("/cartoes-pagamento/9999").send({
      nome_titular: "Inexistente",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Cartão não encontrado");
  });

  it("DELETE /cartoes-pagamento/:id - deve deletar um cartão", async () => {
    const res = await request(app).delete(`/cartoes-pagamento/${cartaoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Cartão deletado com sucesso");
  });

  it("DELETE /cartoes-pagamento/:id - deve retornar 404 se cartão não existir", async () => {
    const res = await request(app).delete(`/cartoes-pagamento/${cartaoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Cartão não encontrado");
  });

  it("GET /cartoes-pagamento/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/cartoes-pagamento/${cartaoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Cartão não encontrado");
  });
});
