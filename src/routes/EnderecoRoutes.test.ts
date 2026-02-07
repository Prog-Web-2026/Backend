// tests/endereco.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Endereco Routes API Tests", () => {
  let enderecoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /enderecos - deve criar um endereço", async () => {
    const res = await request(app).post("/enderecos").send({
      id_cliente: 1,
      logradouro: "Rua Teste",
      numero: "123",
      complemento: "Apto 1",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01001000",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_endereco");
    expect(res.body).toHaveProperty("id_cliente", 1);
    expect(res.body).toHaveProperty("logradouro", "Rua Teste");
    expect(res.body).toHaveProperty("numero", "123");
    expect(res.body).toHaveProperty("complemento", "Apto 1");
    expect(res.body).toHaveProperty("bairro", "Centro");
    expect(res.body).toHaveProperty("cidade", "São Paulo");
    expect(res.body).toHaveProperty("estado", "SP");
    expect(res.body).toHaveProperty("cep", "01001000");

    enderecoId = res.body.id_endereco;
  });

  it("GET /enderecos - deve listar todos os endereços", async () => {
    const res = await request(app).get("/enderecos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /enderecos/:id - deve buscar endereço por id", async () => {
    const res = await request(app).get(`/enderecos/${enderecoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_endereco", enderecoId);
    expect(res.body).toHaveProperty("logradouro", "Rua Teste");
  });

  it("GET /enderecos/:id - deve retornar 404 se endereço não existir", async () => {
    const res = await request(app).get("/enderecos/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Endereço não encontrado");
  });

  it("PUT /enderecos/:id - deve atualizar um endereço", async () => {
    const res = await request(app).put(`/enderecos/${enderecoId}`).send({
      logradouro: "Rua Atualizada",
      numero: "456",
      bairro: "Jardim",
      cidade: "Rio de Janeiro",
      estado: "RJ",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_endereco", enderecoId);
    expect(res.body).toHaveProperty("logradouro", "Rua Atualizada");
    expect(res.body).toHaveProperty("numero", "456");
    expect(res.body).toHaveProperty("bairro", "Jardim");
    expect(res.body).toHaveProperty("cidade", "Rio de Janeiro");
    expect(res.body).toHaveProperty("estado", "RJ");
  });

  it("PUT /enderecos/:id - deve retornar 404 se endereço não existir", async () => {
    const res = await request(app).put("/enderecos/9999").send({
      logradouro: "Inexistente",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Endereço não encontrado");
  });

  it("DELETE /enderecos/:id - deve deletar um endereço", async () => {
    const res = await request(app).delete(`/enderecos/${enderecoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Endereço deletado com sucesso");
  });

  it("DELETE /enderecos/:id - deve retornar 404 se endereço não existir", async () => {
    const res = await request(app).delete(`/enderecos/${enderecoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Endereço não encontrado");
  });

  it("GET /enderecos/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/enderecos/${enderecoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Endereço não encontrado");
  });
});
