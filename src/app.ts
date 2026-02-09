// src/app.ts
import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "./middlewares/AuthMiddleware";
import {
  AuthPublicRouter,
  AuthProtectedRouter,
} from "./controllers/AuthController";
import { UserRouter } from "./controllers/UserController";
import {
  ProductPublicRouter,
  ProductProtectedRouter,
} from "./controllers/ProductController";
import { CategoryRouter } from "./controllers/CategoryController";
import { OrderRouter } from "./controllers/OrderController";
import { CartRouter } from "./controllers/CartController";
import { PaymentRouter } from "./controllers/PaymentController";
import { ProductReviewRouter } from "./controllers/ProductReviewController";
import { errorHandler, NotFoundError } from "./config/ErrorHandler";

export const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições. Tente novamente em instantes.",
});

if (process.env.NODE_ENV !== "test") {
  app.use(limiter);
}

app.get("/", (_req, res) => {
  res.json({
    message: "API E-commerce rodando!",
    version: "2.0.0",
    endpoints: {
      auth: {
        public:
          "/auth (register, login, verify, delivery/register, delivery/login)",
        protected: "/auth (logout, me, change-password, check, role, refresh)",
      },
      products: "/products",
      categories: "/categories",
      users: "/users",
      orders: "/orders",
      cart: "/cart",
      payments: "/payments",
      reviews: "/reviews",
    },
  });
});

app.use("/auth", AuthPublicRouter);

// ROTAS PÚBLICAS
app.use("/products", ProductPublicRouter);
app.use("/categories", CategoryRouter);

app.use(authenticate);

// ROTAS PROTEGIDAS
app.use("/auth", AuthProtectedRouter);
app.use("/users", UserRouter);
app.use("/products", ProductProtectedRouter); // Rotas protegidas de produtos
app.use("/orders", OrderRouter);
app.use("/cart", CartRouter);
app.use("/payments", PaymentRouter);
app.use("/reviews", ProductReviewRouter);

app.use((req, _res, next) => {
  next(new NotFoundError(`Rota ${req.method} ${req.path} não encontrada`));
});

app.use(errorHandler);
