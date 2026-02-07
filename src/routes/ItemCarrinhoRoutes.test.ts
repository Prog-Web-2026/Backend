import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("ItemCarrinho Routes API Tests", () => {
  const id_carrinho = 1;
  const id_produto = 1;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /itens-carrinho - deve criar item do carrinho", async () => {
    const res = await request(app).post("/itens-carrinho").send({
      id_carrinho,
      id_produto,
      quantidade: 2,
      preco_unitario: 50,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_carrinho", id_carrinho);
    expect(res.body).toHaveProperty("id_produto", id_produto);
    expect(res.body).toHaveProperty("quantidade", 2);
    expect(res.body).toHaveProperty("preco_unitario");
  });

  it("GET /itens-carrinho - deve listar todos os itens do carrinho", async () => {
    const res = await request(app).get("/itens-carrinho");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /itens-carrinho/:id_carrinho/:id_produto - deve buscar item", async () => {
    const res = await request(app).get(
      `/itens-carrinho/${id_carrinho}/${id_produto}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_carrinho", id_carrinho);
    expect(res.body).toHaveProperty("id_produto", id_produto);
  });

  it("GET /itens-carrinho/:id_carrinho/:id_produto - deve retornar 404 se não existir", async () => {
    const res = await request(app).get("/itens-carrinho/999/999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Item não encontrado");
  });

  it("PUT /itens-carrinho/:id_carrinho/:id_produto - deve atualizar item", async () => {
    const res = await request(app)
      .put(`/itens-carrinho/${id_carrinho}/${id_produto}`)
      .send({
        quantidade: 5,
        preco_unitario: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("quantidade", 5);
    expect(res.body).toHaveProperty("preco_unitario");
  });

  it("PUT /itens-carrinho/:id_carrinho/:id_produto - deve retornar 404 se não existir", async () => {
    const res = await request(app)
      .put("/itens-carrinho/999/999")
      .send({ quantidade: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Item não encontrado");
  });

  it("DELETE /itens-carrinho/:id_carrinho/:id_produto - deve deletar item", async () => {
    const res = await request(app).delete(
      `/itens-carrinho/${id_carrinho}/${id_produto}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Item deletado com sucesso");
  });

  it("DELETE /itens-carrinho/:id_carrinho/:id_produto - deve retornar 404 se não existir", async () => {
    const res = await request(app).delete(
      `/itens-carrinho/${id_carrinho}/${id_produto}`,
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Item não encontrado");
  });

  it("GET /itens-carrinho/:id_carrinho/:id_produto - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(
      `/itens-carrinho/${id_carrinho}/${id_produto}`,
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Item não encontrado");
  });
});
