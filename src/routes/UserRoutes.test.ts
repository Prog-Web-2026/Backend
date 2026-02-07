import request from "supertest";
import { app } from "../app";
import sequelize from "../config/database";

describe("User Routes API Tests", () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /users - deve criar um usuário", async () => {
    const res = await request(app).post("/users").send({
      name: "Marcos",
      email: "marcos@email.com",
      password: "123456",
    });

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("user.id");
    expect(res.body).toHaveProperty("user.name", "Marcos");
    expect(res.body).toHaveProperty("user.email", "marcos@email.com");

    userId = res.body.user.id;
  });

  it("POST /users/login - deve autenticar e retornar token", async () => {
    const res = await request(app).post("/users/login").send({
      email: "marcos@email.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", "marcos@email.com");

    token = res.body.token;
  });

  it("GET /users - deve retornar lista de usuários (rota protegida)", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /users/:id - deve retornar usuário pelo id", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", userId);
    expect(res.body).toHaveProperty("email", "marcos@email.com");
  });

  it("PUT /users/:id - deve atualizar usuário", async () => {
    const res = await request(app)
      .put(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Marcos Atualizado",
      });

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("user.name", "Marcos Atualizado");
  });

  it("DELETE /users/:id - deve deletar usuário", async () => {
    const res = await request(app)
      .delete(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("GET /users/:id - deve retornar erro pois usuário foi deletado", async () => {
    const res = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("GET /users - deve negar acesso sem token", async () => {
    const res = await request(app).get("/users");

    expect(res.status).toBe(401);
  });

  it("POST /users/login - deve falhar com senha errada", async () => {
    const res = await request(app).post("/users/login").send({
      email: "marcos@email.com",
      password: "senhaerrada",
    });

    expect([400, 401]).toContain(res.status);
  });
});
