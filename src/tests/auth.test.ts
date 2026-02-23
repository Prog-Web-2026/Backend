import request from "supertest";
import { app } from "../app";
import { UserRole } from "../models/UserModel";

describe("Auth Controller E2E Tests", () => {
  describe("POST /auth/register", () => {
    it("should register a new customer successfully when valid data is provided", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "Novo Cliente",
          email: "novo.cliente@example.com",
          password: "senha123456",
          role: "customer",
          address: {
            street: "Rua Nova",
            number: "456",
            neighborhood: "Novo Bairro",
            city: "Nova Cidade",
            state: "NC",
            zipCode: "87654321",
          },
          phone: "11888888888",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("novo.cliente@example.com");
      expect(response.body.user.role).toBe("customer");
      expect(response.body.user.isActive).toBe(true);
    });

    it("should register a new delivery user successfully when valid data is provided", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Novo Entregador",
        email: "novo.entregador@example.com",
        password: "senha123456",
        role: "delivery",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("delivery");
    });

    it("should not register when email is already in use", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Cliente Duplicado",
        email: "customer@example.com",
        password: "senha123456",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Email já está em uso");
    });

    it("should not register when password is too short", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Cliente Senha Curta",
        email: "senha.curta@example.com",
        password: "123",
      });

      expect(response.status).toBe(400);
    });

    it("should not register when role is invalid", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Cliente Role Inválida",
        email: "role.invalida@example.com",
        password: "senha123456",
        role: "invalid_role",
      });

      expect(response.status).toBe(400);
    });

    it("should not register when name is missing", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "sem.nome@example.com",
        password: "senha123456",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("name");
    });

    it("should not register when email is missing", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Sem Email",
        password: "senha123456",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("email");
    });

    it("should not register when email is invalid", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Email Inválido",
        email: "nao-e-email",
        password: "senha123456",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("email");
    });

    it("should not register when password is missing", async () => {
      const response = await request(app).post("/auth/register").send({
        name: "Sem Senha",
        email: "sem.senha@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("password");
    });
  });

  describe("POST /auth/login", () => {
    it("should login successfully when correct credentials are provided", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "customer@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("customer@example.com");
    });

    it("should not login when password is incorrect", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "customer@example.com",
        password: "senhaerrada",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Email ou senha incorretos");
    });

    it("should not login when account is deactivated", async () => {
      const User = (await import("../models/UserModel")).User;
      const deactivatedUser = await User.create({
        name: "Usuário Desativado",
        email: "desativado@example.com",
        password: await global.authService.hashPassword("senha123456"),
        role: UserRole.CUSTOMER,
        isActive: false,
      });

      const response = await request(app).post("/auth/login").send({
        email: "desativado@example.com",
        password: "senha123456",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Conta desativada");
    });

    it("should not login when email is not registered", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "nao.existe@example.com",
        password: "senha123456",
      });

      expect(response.status).toBe(401);
    });

    it("should not login when email is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        password: "senha123456",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("email");
    });

    it("should not login when password is missing", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "customer@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("password");
    });
  });

  describe("POST /auth/delivery/login", () => {
    it("should allow delivery user to login when using delivery route", async () => {
      const response = await request(app).post("/auth/delivery/login").send({
        email: "delivery@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe("delivery");
    });

    it("should not allow customer to login when using delivery route", async () => {
      const response = await request(app).post("/auth/delivery/login").send({
        email: "customer@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain(
        "Apenas entregadores podem fazer login aqui",
      );
    });
  });

  describe("POST /auth/verify", () => {
    it("should verify token successfully when token is valid", async () => {
      const response = await request(app)
        .post("/auth/verify")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.payload.email).toBe("customer@example.com");
    });

    it("should reject verification when token is invalid", async () => {
      const response = await request(app)
        .post("/auth/verify")
        .set("Authorization", "Bearer token.invalido.123");

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
    });

    it("should reject verification when token is missing", async () => {
      const response = await request(app).post("/auth/verify");

      expect(response.status).toBe(401);
    });
  });

  describe("Protected Routes", () => {
    it("should access protected route when token is valid", async () => {
      const response = await request(app)
        .get("/auth/check")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
    });

    it("should not access protected route when token is missing", async () => {
      const response = await request(app).get("/auth/check");

      expect(response.status).toBe(401);
    });

    it("should not access protected route when token is invalid", async () => {
      const response = await request(app)
        .get("/auth/check")
        .set("Authorization", "Bearer token.invalido");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /auth/role", () => {
    it("should return admin role when user is admin", async () => {
      const response = await request(app)
        .get("/auth/role")
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`);

      expect(response.status).toBe(200);
      expect(response.body.isAdmin).toBe(true);
      expect(response.body.isDelivery).toBe(false);
      expect(response.body.isCustomer).toBe(false);
      expect(response.body.role).toBe("admin");
    });

    it("should return customer role when user is customer", async () => {
      const response = await request(app)
        .get("/auth/role")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(200);
      expect(response.body.isAdmin).toBe(false);
      expect(response.body.isDelivery).toBe(false);
      expect(response.body.isCustomer).toBe(true);
      expect(response.body.role).toBe("customer");
    });

    it("should return delivery role when user is delivery", async () => {
      const response = await request(app)
        .get("/auth/role")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testDelivery)}`,
        );

      expect(response.status).toBe(200);
      expect(response.body.isAdmin).toBe(false);
      expect(response.body.isDelivery).toBe(true);
      expect(response.body.isCustomer).toBe(false);
      expect(response.body.role).toBe("delivery");
    });
  });

  describe("POST /auth/change-password", () => {
    it("should change password successfully when current password is correct", async () => {
      const response = await request(app)
        .post("/auth/change-password")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          currentPassword: "password123",
          newPassword: "novaSenha123",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("alterada com sucesso");
    });

    it("should not change password when current password is incorrect", async () => {
      const response = await request(app)
        .post("/auth/change-password")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          currentPassword: "senhaerrada",
          newPassword: "novaSenha123",
        });

      expect(response.status).toBe(400);
    });

    it("should not change password when fields are missing", async () => {
      const response = await request(app)
        .post("/auth/change-password")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("currentPassword");
      expect(response.body.details).toHaveProperty("newPassword");
    });

    it("should not change password when new password is too short", async () => {
      const response = await request(app)
        .post("/auth/change-password")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          currentPassword: "password123",
          newPassword: "12",
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty("newPassword");
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh token successfully when token is valid", async () => {
      const token = await getAuthToken(global.testCustomer);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toBeTruthy();
    });
  });
});
