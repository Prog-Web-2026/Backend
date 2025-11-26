import { Router } from "express";
import { ItemPedidoController } from "../controllers/ItemPedidoController";

const router = Router();
const controller = new ItemPedidoController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id_pedido/:id_produto", controller.getById.bind(controller));
router.put("/:id_pedido/:id_produto", controller.update.bind(controller));
router.delete("/:id_pedido/:id_produto", controller.delete.bind(controller));

export default router;
