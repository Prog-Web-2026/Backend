import express from "express";
import request from "supertest";
import { createLoginLimiter, createGeneralLimiter } from "../app";
import { authenticate } from "../middlewares/AuthMiddleware";
import {
  AuthPublicRouter,
  AuthProtectedRouter,
} from "../controllers/AuthController";
import {
  ProductPublicRouter,
  ProductProtectedRouter,
} from "../controllers/ProductController";
import {
  CategoryPublicRoutes,
  CategoryPrivateRoutes,
} from "../controllers/CategoryController";
import { UserRouter } from "../controllers/UserController";
import { OrderRouter } from "../controllers/OrderController";
import { CartRouter } from "../controllers/CartController";
import { PaymentRouter } from "../controllers/PaymentController";
import { ProductReviewRouter } from "../controllers/ProductReviewController";
import { errorHandler, NotFoundError } from "../config/ErrorHandler";

function createAppWithRateLimiting() {
  const app = express();
  app.use(express.json());

  app.use(createGeneralLimiter());
  app.use("/auth/login", createLoginLimiter());
  app.use("/auth/delivery/login", createLoginLimiter());

  app.use("/auth", AuthPublicRouter);
  app.use("/products", ProductPublicRouter);
  app.use("/categories", CategoryPublicRoutes);

  app.use(authenticate);

  app.use("/auth", AuthProtectedRouter);
  app.use("/users", UserRouter);
  app.use("/products", ProductProtectedRouter);
  app.use("/orders", OrderRouter);
  app.use("/cart", CartRouter);
  app.use("/payments", PaymentRouter);
  app.use("/reviews", ProductReviewRouter);
  app.use("/categories", CategoryPrivateRoutes);

  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
  });

  app.use(errorHandler);

  return app;
}

describe("Rate Limiting E2E Tests", () => {
  describe("Login Rate Limit (5 requests per window)", () => {
    it("should return 429 when login requests exceed 5 per window", async () => {
      const rateLimitedApp = createAppWithRateLimiting();

      for (let i = 0; i < 5; i++) {
        const res = await request(rateLimitedApp)
          .post("/auth/login")
          .send({ email: "customer@example.com", password: "password123" });
        expect(res.status).not.toBe(429);
      }

      const blockedResponse = await request(rateLimitedApp)
        .post("/auth/login")
        .send({ email: "customer@example.com", password: "password123" });

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.message).toContain("Too many login attempts");
    });

    it("should return 429 when delivery login requests exceed 5 per window", async () => {
      const rateLimitedApp = createAppWithRateLimiting();

      for (let i = 0; i < 5; i++) {
        const res = await request(rateLimitedApp)
          .post("/auth/delivery/login")
          .send({ email: "delivery@example.com", password: "password123" });
        expect(res.status).not.toBe(429);
      }

      const blockedResponse = await request(rateLimitedApp)
        .post("/auth/delivery/login")
        .send({ email: "delivery@example.com", password: "password123" });

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.message).toContain("Too many login attempts");
    });
  });

  describe("General Rate Limit (100 requests per window)", () => {
    it("should return 429 when requests to a public route exceed 100 per window", async () => {
      const rateLimitedApp = createAppWithRateLimiting();

      for (let i = 0; i < 100; i++) {
        const res = await request(rateLimitedApp).get("/products");
        expect(res.status).not.toBe(429);
      }

      const blockedResponse = await request(rateLimitedApp).get("/products");

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.message).toContain("Too many requests");
    });

    it("should return 429 when requests to a protected route exceed 100 per window", async () => {
      const rateLimitedApp = createAppWithRateLimiting();
      const token = await global.getAuthToken(global.testCustomer);

      for (let i = 0; i < 100; i++) {
        const res = await request(rateLimitedApp)
          .get("/auth/check")
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).not.toBe(429);
      }

      const blockedResponse = await request(rateLimitedApp)
        .get("/auth/check")
        .set("Authorization", `Bearer ${token}`);

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.message).toContain("Too many requests");
    });
  });
});
