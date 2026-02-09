import { Router } from "express";
import { ClienteController } from "../controllers/ClienteController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { ClienteValidator } from "../validators/ClienteValidator";

const router = Router();
const controller = new ClienteController();

// Protegendo apenas endpoints que modificam dados e aplicando validação
router.post(
	"/",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(ClienteValidator.createClienteSchema),
	controller.create.bind(controller)
);
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put(
	"/:id",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(ClienteValidator.updateClienteSchema),
	controller.update.bind(controller)
);
router.delete("/:id", authMiddleware.authenticate, controller.delete.bind(controller));

export default router;
