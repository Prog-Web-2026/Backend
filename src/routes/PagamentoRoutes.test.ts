import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Pagamento Routes API Tests", () => {
  let pagamentoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /pagamentos - deve criar um pagamento (PIX)", async () => {
    const res = await request(app).post("/pagamentos").send({
      id_pedido: 1,
      metodo_pagamento: "pix",
      valor: 150.5,
      status: "pendente",
      chave_pix: "chave-pix-teste",
    });

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("id_pagamento");
    expect(res.body).toHaveProperty("id_pedido", 1);
    expect(res.body).toHaveProperty("metodo_pagamento", "pix");
    expect(res.body).toHaveProperty("valor");
    expect(res.body).toHaveProperty("status", "pendente");
    expect(res.body).toHaveProperty("chave_pix", "chave-pix-teste");

    pagamentoId = res.body.id_pagamento;
  });

  it("GET /pagamentos - deve listar todos os pagamentos", async () => {
    const res = await request(app).get("/pagamentos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /pagamentos/:id - deve buscar pagamento por id", async () => {
    const res = await request(app).get(`/pagamentos/${pagamentoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_pagamento", pagamentoId);
    expect(res.body).toHaveProperty("metodo_pagamento", "pix");
  });

  it("GET /pagamentos/:id - deve retornar 404 se pagamento não existir", async () => {
    const res = await request(app).get("/pagamentos/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pagamento não encontrado");
  });

  it("PUT /pagamentos/:id - deve atualizar pagamento", async () => {
    const res = await request(app).put(`/pagamentos/${pagamentoId}`).send({
      status: "confirmado",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_pagamento", pagamentoId);
    expect(res.body).toHaveProperty("status", "confirmado");
  });

  it("PUT /pagamentos/:id - deve retornar 404 se pagamento não existir", async () => {
    const res = await request(app).put("/pagamentos/9999").send({
      status: "falhou",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pagamento não encontrado");
  });

  it("DELETE /pagamentos/:id - deve deletar pagamento", async () => {
    const res = await request(app).delete(`/pagamentos/${pagamentoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Pagamento deletado com sucesso",
    );
  });

  it("DELETE /pagamentos/:id - deve retornar 404 se pagamento não existir", async () => {
    const res = await request(app).delete(`/pagamentos/${pagamentoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pagamento não encontrado");
  });

  it("GET /pagamentos/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/pagamentos/${pagamentoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Pagamento não encontrado");
  });
});
