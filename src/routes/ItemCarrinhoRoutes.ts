import { Router } from "express";
import { ItemCarrinhoController } from "../controllers/ItemCarrinhoController";

const router = Router();
const controller = new ItemCarrinhoController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id_carrinho/:id_produto", controller.getById.bind(controller));
router.put("/:id_carrinho/:id_produto", controller.update.bind(controller));
router.delete("/:id_carrinho/:id_produto", controller.delete.bind(controller));

export default router;
