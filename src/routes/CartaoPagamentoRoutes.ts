import { Router } from "express";
import { CartaoPagamentoController } from "../controllers/CartaoPagamentoController";

const router = Router();
const controller = new CartaoPagamentoController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
