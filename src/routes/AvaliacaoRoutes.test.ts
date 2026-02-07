// tests/avaliacao.test.ts
import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("Avaliação Routes API Tests", () => {
  let avaliacaoId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /avaliacoes - deve criar uma avaliação", async () => {
    const res = await request(app).post("/avaliacoes").send({
      id_cliente: 1,
      id_produto: 1,
      nota: 5,
      comentario: "Excelente produto",
      data_avaliacao: "2026-02-07",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id_avaliacao");
    expect(res.body).toHaveProperty("id_cliente", 1);
    expect(res.body).toHaveProperty("id_produto", 1);
    expect(res.body).toHaveProperty("nota", 5);
    expect(res.body).toHaveProperty("comentario", "Excelente produto");
    expect(new Date(res.body.data_avaliacao).toISOString()).toBe(
      new Date("2026-02-07").toISOString(),
    );

    avaliacaoId = res.body.id_avaliacao;
  });

  it("GET /avaliacoes - deve listar todas as avaliações", async () => {
    const res = await request(app).get("/avaliacoes");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /avaliacoes/:id - deve buscar avaliação por id", async () => {
    const res = await request(app).get(`/avaliacoes/${avaliacaoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_avaliacao", avaliacaoId);
    expect(res.body).toHaveProperty("nota", 5);
  });

  it("GET /avaliacoes/:id - deve retornar 404 se avaliação não existir", async () => {
    const res = await request(app).get("/avaliacoes/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Avaliação não encontrada");
  });

  it("PUT /avaliacoes/:id - deve atualizar uma avaliação", async () => {
    const res = await request(app).put(`/avaliacoes/${avaliacaoId}`).send({
      nota: 4,
      comentario: "Bom produto",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_avaliacao", avaliacaoId);
    expect(res.body).toHaveProperty("nota", 4);
    expect(res.body).toHaveProperty("comentario", "Bom produto");
  });

  it("PUT /avaliacoes/:id - deve retornar 404 se avaliação não existir", async () => {
    const res = await request(app).put("/avaliacoes/9999").send({
      nota: 3,
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Avaliação não encontrada");
  });

  it("DELETE /avaliacoes/:id - deve deletar uma avaliação", async () => {
    const res = await request(app).delete(`/avaliacoes/${avaliacaoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Avaliação deletada com sucesso",
    );
  });

  it("DELETE /avaliacoes/:id - deve retornar 404 se avaliação não existir", async () => {
    const res = await request(app).delete(`/avaliacoes/${avaliacaoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Avaliação não encontrada");
  });

  it("GET /avaliacoes/:id - deve retornar 404 após deletar", async () => {
    const res = await request(app).get(`/avaliacoes/${avaliacaoId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Avaliação não encontrada");
  });
});
