import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { UserValidator } from "../validators/UserValidator";

const router = Router();
const controller = new UserController();

// Rota de criação (mantida em `/` para compatibilidade) com validação
router.post(
  "/",
  authMiddleware.validateRequest(UserValidator.createUserSchema),
  controller.create.bind(controller)
);

// Login (opcional, mantido caso o front precise desse endpoint)
router.post(
  "/login",
  authMiddleware.validateRequest(UserValidator.loginSchema),
  controller.login.bind(controller)
);

// Rotas protegidas
router.get("/", authMiddleware.authenticate, controller.getAll.bind(controller));
router.get("/:id", authMiddleware.authenticate, controller.getById.bind(controller));
router.put(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.validateRequest(UserValidator.updateUserSchema),
  controller.update.bind(controller)
);
router.delete("/:id", authMiddleware.authenticate, controller.delete.bind(controller));

export default router;
