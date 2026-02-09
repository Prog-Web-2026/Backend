import { Request, Response, NextFunction, Router } from "express";
import { CategoryService } from "../services/CategoryService";
import { UserRole } from "../models/UserModel";
import { adminMiddleware } from "../middlewares/AuthMiddleware";

const categoryService = new CategoryService();
const router = Router();

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserRole = req.user?.role as UserRole;
      const data = req.body;

      const category = await categoryService.createCategory(
        data,
        currentUserRole,
      );

      res.status(201).json({
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

      const category = await categoryService.updateCategory(
        id,
        data,
        currentUserRole,
      );

      res.status(200).json({
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
        categories,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new CategoryController();

const publicRoutes = Router();
publicRoutes.get("/", controller.getAllCategories.bind(controller));
publicRoutes.get("/popular", controller.getPopularCategories.bind(controller));
publicRoutes.get("/:id", controller.getCategoryById.bind(controller));

const privateRoutes = Router();
privateRoutes.use(adminMiddleware);
privateRoutes.post("/", controller.createCategory.bind(controller));
privateRoutes.put("/:id", controller.updateCategory.bind(controller));
privateRoutes.delete("/:id", controller.deleteCategory.bind(controller));
privateRoutes.patch(
  "/:id/status",
  controller.toggleCategoryStatus.bind(controller),
);

export {
  publicRoutes as CategoryPublicRoutes,
  privateRoutes as CategoryPrivateRoutes,
};
