import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Produto Routes API Tests", () => {
  let produtoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /produtos - deve criar um produto", async () => {
    const res = await request(app).post("/produtos").send({
      nome: "Produto Teste",
      descricao: "Descrição do produto",
      preco: 99.9,
      estoque: 10,
    });

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("id_produto");
    expect(res.body).toHaveProperty("nome", "Produto Teste");
    expect(res.body).toHaveProperty("descricao", "Descrição do produto");
    expect(res.body).toHaveProperty("preco", 99.9);
    expect(res.body).toHaveProperty("estoque", 10);

    produtoId = res.body.id_produto;
  });

  it("GET /produtos - deve listar todos os produtos", async () => {
    const res = await request(app).get("/produtos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /produtos/:id - deve buscar produto por id", async () => {
    const res = await request(app).get(`/produtos/${produtoId}`);

    expect(res.status).toBe(200);

    // ajuste aqui: teu ID é id_produto
    expect(res.body).toHaveProperty("id_produto", produtoId);
    expect(res.body).toHaveProperty("nome", "Produto Teste");
  });

  it("GET /produtos/:id - deve retornar 404 se produto não existir", async () => {
    const res = await request(app).get("/produtos/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Produto não encontrado");
  });

  it("PUT /produtos/:id - deve atualizar um produto", async () => {
    const res = await request(app).put(`/produtos/${produtoId}`).send({
      nome: "Produto Atualizado",
      preco: 150,
      estoque: 20,
    });

    expect(res.status).toBe(200);

    // ajuste aqui: teu ID é id_produto
    expect(res.body).toHaveProperty("id_produto", produtoId);
    expect(res.body).toHaveProperty("nome", "Produto Atualizado");
    expect(res.body).toHaveProperty("preco", 150);
    expect(res.body).toHaveProperty("estoque", 20);
  });

  it("PUT /produtos/:id - deve retornar 404 se produto não existir", async () => {
    const res = await request(app).put("/produtos/9999").send({
      nome: "Inexistente",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Produto não encontrado");
  });

  it("DELETE /produtos/:id - deve deletar um produto", async () => {
    const res = await request(app).delete(`/produtos/${produtoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Produto deletado com sucesso");
  });

  it("DELETE /produtos/:id - deve retornar 404 se produto não existir", async () => {
    const res = await request(app).delete(`/produtos/${produtoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Produto não encontrado");
  });

  it("GET /produtos/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/produtos/${produtoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Produto não encontrado");
  });
});
