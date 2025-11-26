import { Router } from "express";
import { EntregadorController } from "../controllers/EntregadorController";

const router = Router();
const controller = new EntregadorController();

router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
