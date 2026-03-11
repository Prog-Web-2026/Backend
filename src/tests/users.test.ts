import request from "supertest";
import { app } from "../app";
import { UserRole } from "../models/UserModel";

jest.mock("../services/GeolocationService", () => ({
  GeolocationService: jest.fn().mockImplementation(() => ({
    geocodeAddress: jest.fn().mockResolvedValue({
      latitude: -23.5505,
      longitude: -46.6333,
    }),
  })),
}));

describe("User Controller E2E Tests", () => {
  describe("GET /users (Admin only)", () => {
    it("should list all users when user is admin", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it("should return 403 when user is not admin", async () => {
      const response = await request(app)
        .get("/users")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(403);
    });

    it("should filter users by role when query role=customer", async () => {
      const response = await request(app)
        .get("/users?role=customer")
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`);

      expect(response.status).toBe(200);
      expect(response.body.every((user: any) => user.role === "customer")).toBe(
        true,
      );
    });

    it("should filter users by active status when query isActive=true", async () => {
      const response = await request(app)
        .get("/users?isActive=true")
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`);

      expect(response.status).toBe(200);
      expect(response.body.every((user: any) => user.isActive === true)).toBe(
        true,
      );
    });
  });

  describe("GET /users/:id", () => {
    it("should allow user to see own profile when requesting own id", async () => {
      const response = await request(app)
        .get(`/users/${global.testCustomer.id}`)
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(global.testCustomer.id);
      expect(response.body.email).toBe("customer@example.com");
    });

    it("should allow admin to see any user profile when requesting any id", async () => {
      const response = await request(app)
        .get(`/users/${global.testCustomer.id}`)
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(global.testCustomer.id);
    });

    it("should return 403 when user requests another user's profile", async () => {
      const response = await request(app)
        .get(`/users/${global.testAdmin.id}`)
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        );

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update own profile when user updates own data", async () => {
      const response = await request(app)
        .put(`/users/${global.testCustomer.id}`)
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          name: "Nome Atualizado",
          email: "customer.updated@example.com",
          phone: "11988887777",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Nome Atualizado");
      expect(response.body.user.phone).toBe("11988887777");
    });

    it("should update any user profile when admin updates a user", async () => {
      const response = await request(app)
        .put(`/users/${global.testCustomer.id}`)
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`)
        .send({
          name: "Atualizado por Admin",
          email: "customer.updatedbyadmin@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Atualizado por Admin");
    });

    it("should return 403 when user tries to update role", async () => {
      const response = await request(app)
        .put(`/users/${global.testCustomer.id}`)
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          role: UserRole.ADMIN,
        });

      expect(response.status).toBe(403);
    });
  });

  describe("PATCH /users/:id/status (Admin only)", () => {
    it("should toggle user active status when admin requests", async () => {
      const User = (await import("../models/UserModel")).User;
      const testUser = await User.create({
        name: "Usuário Teste Status",
        email: "status.test@example.com",
        password: await global.authService.hashPassword("senha123"),
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      const response1 = await request(app)
        .patch(`/users/${testUser.id}/status`)
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`)
        .send({ isActive: false });

      expect(response1.status).toBe(200);
      expect(response1.body.user.isActive).toBe(false);

      const response2 = await request(app)
        .patch(`/users/${testUser.id}/status`)
        .set("Authorization", `Bearer ${await getAuthToken(global.testAdmin)}`)
        .send({ isActive: true });

      expect(response2.status).toBe(200);
      expect(response2.body.user.isActive).toBe(true);
    });

    it("should return 403 when user tries to update role", async () => {
      const response = await request(app)
        .put(`/users/${global.testCustomer.id}`)
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({ role: "admin" });

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /users/me/address", () => {
    it("should update own address when user is customer", async () => {
      const response = await request(app)
        .put("/users/me/address")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          street: "Avenida Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          zipCode: "01311000",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.address.street).toBe("Avenida Paulista");
      expect(response.body.user.address.city).toBe("São Paulo");
    });

    it("should allow delivery person to update address", async () => {
      const response = await request(app)
        .put("/users/me/address")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testDelivery)}`,
        )
        .send({
          street: "Rua do Entregador",
          number: "50",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01001000",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.address.street).toBe("Rua do Entregador");
    });

    it("should return 400 when address is incomplete", async () => {
      const response = await request(app)
        .put("/users/me/address")
        .set(
          "Authorization",
          `Bearer ${await getAuthToken(global.testCustomer)}`,
        )
        .send({
          street: "Rua Incompleta",
        });

      expect(response.status).toBe(400);
    });
  });

});
