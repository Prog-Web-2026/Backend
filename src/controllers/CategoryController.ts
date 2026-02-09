import { Request, Response, NextFunction, Router } from "express";
import { CategoryService } from "../services/CategoryService";
import { UserRole } from "../models/UserModel";
import { FileUploadService } from "../services/FileUploadService";
import { adminMiddleware } from "../middlewares/AuthMiddleware";

const categoryService = new CategoryService();
const fileUploadService = new FileUploadService();
const router = Router();

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserRole = req.user?.role as UserRole;
      const data = req.body;
      const imageFile = req.file;

      const category = await categoryService.createCategory(
        data,
        imageFile,
        currentUserRole,
      );

      res.status(201).json({
        success: true,
        message: "Categoria criada com sucesso",
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const includeProducts = req.query.includeProducts === "true";

      const categories = await categoryService.getAllCategories(
        includeInactive,
        includeProducts,
      );

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const includeProducts = req.query.includeProducts === "true";

      const category = await categoryService.getCategoryById(
        id,
        includeProducts,
      );

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const data = req.body;
      const imageFile = req.file;

      const category = await categoryService.updateCategory(
        id,
        data,
        imageFile,
        currentUserRole,
      );

      res.status(200).json({
        success: true,
        message: "Categoria atualizada com sucesso",
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;

      await categoryService.deleteCategory(id, currentUserRole);

      res.status(200).json({
        success: true,
        message: "Categoria excluída com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleCategoryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const { isActive } = req.body;

      const category = await categoryService.toggleCategoryStatus(
        id,
        isActive,
        currentUserRole,
      );

      res.status(200).json({
        success: true,
        message: `Categoria ${isActive ? "ativada" : "desativada"} com sucesso`,
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPopularCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;

      const categories = await categoryService.getPopularCategories(limit);

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadCategoryImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          message: "Nenhuma imagem enviada",
        });
      }

      const category = await categoryService.updateCategory(
        id,
        {},
        imageFile,
        currentUserRole,
      );

      res.status(200).json({
        success: true,
        message: "Imagem da categoria atualizada com sucesso",
        category,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new CategoryController();
const uploadMiddleware = fileUploadService.getUploadMiddleware();

// Rotas
router.get("/", controller.getAllCategories.bind(controller));
router.get("/popular", controller.getPopularCategories.bind(controller));
router.get("/:id", controller.getCategoryById.bind(controller));

router.post(
  "/",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.createCategory.bind(controller),
);
router.put(
  "/:id",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.updateCategory.bind(controller),
);
router.delete(
  "/:id",
  adminMiddleware,
  controller.deleteCategory.bind(controller),
);
router.patch(
  "/:id/status",
  adminMiddleware,
  controller.toggleCategoryStatus.bind(controller),
);
router.post(
  "/:id/image",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.uploadCategoryImage.bind(controller),
);

export { router as CategoryRouter };
