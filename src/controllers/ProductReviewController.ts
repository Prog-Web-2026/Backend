import { Request, Response, NextFunction, Router } from "express";
import { ProductReviewService } from "../services/ProductReviewService";
import { FileUploadService } from "../services/FileUploadService";
import {
  authenticate,
  adminMiddleware,
  customerMiddleware,
} from "../middlewares/AuthMiddleware";

const productReviewService = new ProductReviewService();
const fileUploadService = new FileUploadService();
const router = Router();

export class ProductReviewController {
  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.productId);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;
      const { rating, comment } = req.body;
      const imageFile = req.file;

      const review = await productReviewService.addReview(
        productId,
        userId,
        rating,
        comment,
        imageFile,
        currentUserRole,
      );

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.productId);
      const {
        page = 1,
        limit = 10,
        minRating,
        maxRating,
        sortBy,
        hasImage,
      } = req.query;

      const filters: any = {};
      if (minRating) filters.minRating = Number(minRating);
      if (maxRating) filters.maxRating = Number(maxRating);
      if (sortBy) filters.sortBy = sortBy.toString();
      if (hasImage !== undefined) filters.hasImage = hasImage === "true";

      const result = await productReviewService.getProductReviews(
        productId,
        Number(page),
        Number(limit),
        filters,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      const review = await productReviewService.getReviewById(
        reviewId,
        userId,
        currentUserRole,
      );

      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;
      const { rating, comment } = req.body;
      const imageFile = req.file;

      const review = await productReviewService.updateReview(
        reviewId,
        userId,
        { rating, comment },
        imageFile,
        currentUserRole,
      );

      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      await productReviewService.deleteReview(
        reviewId,
        userId,
        currentUserRole,
      );

      res.status(200).json({ message: "Avaliação excluída" });
    } catch (error) {
      next(error);
    }
  }

  async getUserReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10, includeInactive } = req.query;

      const result = await productReviewService.getUserReviews(
        userId,
        Number(page),
        Number(limit),
        includeInactive === "true",
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProductReviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.productId);

      const stats = await productReviewService.getProductReviewStats(productId);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  async reportReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const userId = req.user!.id;
      const { details } = req.body;

      const result = await productReviewService.reportReview(
        reviewId,
        userId,
        details,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markReviewAsHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const userId = req.user!.id;

      await productReviewService.markReviewAsHelpful(reviewId, userId);

      res.status(200).json({ message: "Avaliação marcada como útil" });
    } catch (error) {
      next(error);
    }
  }

  async toggleReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.id);
      const currentUserRole = req.user!.role;
      const { isActive } = req.body;

      const review = await productReviewService.toggleReviewStatus(
        reviewId,
        isActive,
        currentUserRole,
      );

      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getRecentReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserRole = req.user!.role;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const reviews = await productReviewService.getRecentReviews(
        limit,
        currentUserRole,
      );

      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }
}

const controller = new ProductReviewController();
const uploadMiddleware = fileUploadService.getUploadMiddleware();

router.get(
  "/product/:productId",
  controller.getProductReviews.bind(controller),
);
router.get(
  "/product/:productId/stats",
  controller.getProductReviewStats.bind(controller),
);

router.post(
  "/product/:productId",
  authenticate,
  customerMiddleware,
  uploadMiddleware.single("image"),
  controller.addReview.bind(controller),
);
router.get(
  "/user/me",
  authenticate,
  customerMiddleware,
  controller.getUserReviews.bind(controller),
);
router.post(
  "/:id/report",
  authenticate,
  controller.reportReview.bind(controller),
);
router.post(
  "/:id/helpful",
  authenticate,
  controller.markReviewAsHelpful.bind(controller),
);

router.get("/:id", authenticate, controller.getReviewById.bind(controller));
router.put(
  "/:id",
  authenticate,
  uploadMiddleware.single("image"),
  controller.updateReview.bind(controller),
);
router.delete("/:id", authenticate, controller.deleteReview.bind(controller));

router.get(
  "/admin/recent",
  authenticate,
  adminMiddleware,
  controller.getRecentReviews.bind(controller),
);
router.patch(
  "/admin/:id/status",
  authenticate,
  adminMiddleware,
  controller.toggleReviewStatus.bind(controller),
);

export { router as ProductReviewRouter };
