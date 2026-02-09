// src/controllers/ProductController.ts
import { Request, Response, NextFunction, Router } from "express";
import { ProductService } from "../services/ProductService";
import { UserRole } from "../models/UserModel";
import { FileUploadService } from "../services/FileUploadService";
import {
  adminMiddleware,
  customerMiddleware,
} from "../middlewares/AuthMiddleware";
import { validate } from "../validate";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../validators/ProductsValidator";

const productService = new ProductService();
const fileUploadService = new FileUploadService();
const publicRouter = Router();
const protectedRouter = Router();
const uploadMiddleware = fileUploadService.getUploadMiddleware();

export class ProductController {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      validate(createProductSchema, req.body);

      const currentUserRole = req.user?.role as UserRole;
      const data = req.body;
      const imageFile = req.file;

      const product = await productService.createProduct(
        data,
        imageFile,
        currentUserRole,
      );

      res.status(201).json({
        message: "Produto criado com sucesso",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, minPrice, maxPrice, inStock, search } = req.query;

      const filters: any = {};
      if (categoryId) filters.categoryId = Number(categoryId);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (inStock !== undefined) filters.inStock = inStock === "true";
      if (search) filters.search = search.toString();

      const products = await productService.getAllProducts(filters);

      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const includeReviews = req.query.includeReviews === "true";

      const product = await productService.getProductById(id, includeReviews);

      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      validate(updateProductSchema, req.body);

      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const data = req.body;
      const imageFile = req.file;

      const product = await productService.updateProduct(
        id,
        data,
        imageFile,
        currentUserRole,
      );

      res.status(200).json({
        message: "Produto atualizado com sucesso",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;

      await productService.deleteProduct(id, currentUserRole);

      res.status(200).json({
        message: "Produto excluído com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      validate(updateStockSchema, req.body);

      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const { quantity, operation } = req.body;

      const product = await productService.updateStock(
        id,
        quantity,
        operation,
        currentUserRole,
      );

      res.status(200).json({
        message: "Estoque atualizado com sucesso",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  async addProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const userId = req.user?.id as number;
      const { rating, comment } = req.body;
      const imageFile = req.file;

      const review = await productService.addProductReview(
        productId,
        userId,
        rating,
        comment,
        imageFile,
      );

      res.status(201).json({
        message: "Avaliação adicionada com sucesso",
        review,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const { page = 1, limit = 10 } = req.query;

      const result = await productService.getProductReviews(
        productId,
        Number(page),
        Number(limit),
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;

      if (!q || q.toString().trim().length < 2) {
        return res.status(400).json({
          message: "Termo de busca deve ter pelo menos 2 caracteres",
        });
      }

      const products = await productService.searchProducts(q.toString());

      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async uploadProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserRole = req.user?.role as UserRole;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          message: "Nenhuma imagem enviada",
        });
      }

      const product = await productService.updateProduct(
        id,
        {},
        imageFile,
        currentUserRole,
      );

      res.status(200).json({
        message: "Imagem do produto atualizada com sucesso",
        product,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ProductController();

// Rotas Públicas
publicRouter.get("/", controller.getAllProducts.bind(controller));
publicRouter.get("/search", controller.searchProducts.bind(controller));
publicRouter.get("/:id", controller.getProductById.bind(controller));
publicRouter.get("/:id/reviews", controller.getProductReviews.bind(controller));

// Rotas Protegidas
protectedRouter.post(
  "/:id/reviews",
  customerMiddleware,
  uploadMiddleware.single("image"),
  controller.addProductReview.bind(controller),
);

protectedRouter.post(
  "/",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.createProduct.bind(controller),
);
protectedRouter.put(
  "/:id",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.updateProduct.bind(controller),
);
protectedRouter.delete(
  "/:id",
  adminMiddleware,
  controller.deleteProduct.bind(controller),
);
protectedRouter.patch(
  "/:id/stock",
  adminMiddleware,
  controller.updateStock.bind(controller),
);
protectedRouter.post(
  "/:id/image",
  adminMiddleware,
  uploadMiddleware.single("image"),
  controller.uploadProductImage.bind(controller),
);

export {
  publicRouter as ProductPublicRouter,
  protectedRouter as ProductProtectedRouter,
};
