import { Router } from "express";
import { PedidoController } from "../controllers/PedidoController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { PedidoValidator } from "../validators/PedidoValidator";

const router = Router();
const controller = new PedidoController();

// Protegendo criação/atualização/deleção e aplicando validação mínima
router.post(
	"/",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(PedidoValidator.createPedidoSchema),
	controller.create.bind(controller)
);
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put(
	"/:id",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(PedidoValidator.updatePedidoSchema),
	controller.update.bind(controller)
);
router.delete("/:id", authMiddleware.authenticate, controller.delete.bind(controller));

export default router;
