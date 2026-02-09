import { Router } from "express";
import { ProdutoController } from "../controllers/ProdutoController";
import { authMiddleware } from "../middleware/AuthMiddleware";
import { ProdutoValidator } from "../validators/ProdutoValidator";

const router = Router();
const controller = new ProdutoController();

// Protegendo criação/atualização/deleção e aplicando validação
router.post(
	"/",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(ProdutoValidator.createProdutoSchema),
	controller.create.bind(controller)
);
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put(
	"/:id",
	authMiddleware.authenticate,
	authMiddleware.validateRequest(ProdutoValidator.updateProdutoSchema),
	controller.update.bind(controller)
);
router.delete("/:id", authMiddleware.authenticate, controller.delete.bind(controller));

export default router;
