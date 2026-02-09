import { ProductReviewRepository } from "../repository/ProductReviewRepository";
import { ProductRepository } from "../repository/ProductRepository";
import { UserRepository } from "../repository/UserRepository";
import { OrderRepository } from "../repository/OrderRepository";
import { OrderItemRepository } from "../repository/OrderItemRepository";
import { FileUploadService } from "./FileUploadService";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../config/ErrorHandler";

export class ProductReviewService {
  private productReviewRepository = new ProductReviewRepository();
  private productRepository = new ProductRepository();
  private orderRepository = new OrderRepository();
  private orderItemRepository = new OrderItemRepository();
  private fileUploadService = new FileUploadService();

  async addReview(
    productId: number,
    userId: number,
    rating: number,
    comment?: string,
    imageFile?: Express.Multer.File,
    currentUserRole: UserRole = UserRole.CUSTOMER,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError("Apenas clientes podem adicionar avaliações");
    }

    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    if (rating < 1 || rating > 5) {
      throw new ValidationError("Avaliação deve ser entre 1 e 5 estrelas");
    }

    const existingReview =
      await this.productReviewRepository.findUserReviewForProduct(
        userId,
        productId,
      );
    if (existingReview) {
      throw new ValidationError("Você já avaliou este produto");
    }

    const hasPurchased = await this.userHasPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new ForbiddenError(
        "Apenas clientes que compraram o produto podem avaliá-lo",
      );
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      this.fileUploadService.validateImageFile(imageFile);
      imageUrl = this.fileUploadService.getFileUrl(imageFile.filename);
    }

    const reviewData: any = {
      userId,
      productId,
      rating,
      comment,
      isActive: true,
    };

    if (imageUrl) {
      reviewData.imageUrl = imageUrl;
    }

    const review = await this.productReviewRepository.create(reviewData);

    await this.updateProductAverageRating(productId);

    return review;
  }

  private async userHasPurchasedProduct(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const userOrders = await this.orderRepository.findByUserId(userId);

    for (const order of userOrders) {
      if (order.status !== "delivered") {
        continue;
      }

      const orderItems = await this.orderItemRepository.findByOrderId(order.id);
      const hasProduct = orderItems.some(
        (item) => item.productId === productId,
      );

      if (hasProduct) {
        return true;
      }
    }

    return false;
  }

  async getProductReviews(
    productId: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      minRating?: number;
      maxRating?: number;
      sortBy?: "newest" | "oldest" | "highest" | "lowest";
      hasImage?: boolean;
    },
  ) {
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    const offset = (page - 1) * limit;

    const options: any = {
      where: {
        productId,
        isActive: true,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
        },
      ],
      limit,
      offset,
    };

    if (filters) {
      if (filters.minRating !== undefined) {
        options.where.rating = { $gte: filters.minRating };
      }

      if (filters.maxRating !== undefined) {
        options.where.rating = options.where.rating || {};
        options.where.rating.$lte = filters.maxRating;
      }

      if (filters.hasImage === true) {
        options.where.imageUrl = { $ne: null };
      } else if (filters.hasImage === false) {
        options.where.imageUrl = null;
      }

      switch (filters.sortBy) {
        case "newest":
          options.order = [["createdAt", "DESC"]];
          break;
        case "oldest":
          options.order = [["createdAt", "ASC"]];
          break;
        case "highest":
          options.order = [
            ["rating", "DESC"],
            ["createdAt", "DESC"],
          ];
          break;
        case "lowest":
          options.order = [
            ["rating", "ASC"],
            ["createdAt", "DESC"],
          ];
          break;
        default:
          options.order = [["createdAt", "DESC"]];
      }
    } else {
      options.order = [["createdAt", "DESC"]];
    }

    const reviews = await this.productReviewRepository.findByProductId(
      productId,
      options,
    );
    const total = await this.getTotalReviewsCount(productId, filters);

    const ratingInfo =
      await this.productReviewRepository.getProductAverageRating(productId);
    const distribution = await this.getRatingDistribution(productId);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      ratingInfo: {
        average: parseFloat(ratingInfo.average.toFixed(1)),
        count: ratingInfo.count,
        distribution,
      },
    };
  }

  private async getTotalReviewsCount(
    productId: number,
    filters?: any,
  ): Promise<number> {
    const where: any = {
      productId,
      isActive: true,
    };

    if (filters) {
      if (filters.minRating !== undefined) {
        where.rating = { $gte: filters.minRating };
      }

      if (filters.maxRating !== undefined) {
        where.rating = where.rating || {};
        where.rating.$lte = filters.maxRating;
      }

      if (filters.hasImage === true) {
        where.imageUrl = { $ne: null };
      } else if (filters.hasImage === false) {
        where.imageUrl = null;
      }
    }

    const reviews =
      await this.productReviewRepository.findByProductId(productId);
    return reviews.length;
  }

  private async getRatingDistribution(
    productId: number,
  ): Promise<Record<number, { count: number; percentage: number }>> {
    const reviews =
      await this.productReviewRepository.findByProductId(productId);
    const total = reviews.length;

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const review of reviews) {
      distribution[review.rating]++;
    }

    const result: Record<number, { count: number; percentage: number }> = {};
    for (let i = 1; i <= 5; i++) {
      const count = distribution[i];
      const percentage = total > 0 ? (count / total) * 100 : 0;
      result[i] = {
        count,
        percentage: parseFloat(percentage.toFixed(1)),
      };
    }

    return result;
  }

  async updateReview(
    reviewId: number,
    userId: number,
    updates: {
      rating?: number;
      comment?: string | null;
      imageUrl?: string | null;
    },
    imageFile?: Express.Multer.File,
    currentUserRole?: UserRole,
  ) {
    const review = await this.productReviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    const isOwner = review.userId === userId;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Acesso negado");
    }

    if (
      updates.rating !== undefined &&
      (updates.rating < 1 || updates.rating > 5)
    ) {
      throw new ValidationError("Avaliação deve ser entre 1 e 5 estrelas");
    }

    if (imageFile) {
      this.fileUploadService.validateImageFile(imageFile);

      if (review.imageUrl) {
        const oldFilename = review.imageUrl.split("/").pop();
        if (oldFilename) {
          await this.fileUploadService.deleteFile(oldFilename);
        }
      }

      updates.imageUrl = this.fileUploadService.getFileUrl(imageFile.filename);
    }

    if (updates.comment === "") {
      updates.comment = null;
    }

    const affectedCount = await this.productReviewRepository.update(
      reviewId,
      updates,
    );

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar avaliação", 500);
    }

    if (updates.rating !== undefined) {
      await this.updateProductAverageRating(review.productId);
    }

    return await this.productReviewRepository.findById(reviewId, {
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
        },
      ],
    });
  }

  async deleteReview(
    reviewId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const review = await this.productReviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    const isOwner = review.userId === userId;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Acesso negado");
    }

    if (review.imageUrl) {
      const filename = review.imageUrl.split("/").pop();
      if (filename) {
        await this.fileUploadService.deleteFile(filename);
      }
    }

    const affectedCount = await this.productReviewRepository.update(reviewId, {
      isActive: false,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao excluir avaliação", 500);
    }

    await this.updateProductAverageRating(review.productId);

    return true;
  }

  private async updateProductAverageRating(productId: number): Promise<void> {
    const ratingInfo =
      await this.productReviewRepository.getProductAverageRating(productId);

    await this.productRepository.update(productId, {
      averageRating: parseFloat(ratingInfo.average.toFixed(1)),
      reviewCount: ratingInfo.count,
    });
  }

  async getUserReviews(
    userId: number,
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false,
  ) {
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const reviews = await this.productReviewRepository.findByUserId(userId, {
      where,
      include: [
        {
          association: "product",
          include: [{ association: "category" }],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const total = (
      await this.productReviewRepository.findByUserId(userId, { where })
    ).length;

    const userStats = await this.getUserReviewStats(userId);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: userStats,
    };
  }

  private async getUserReviewStats(userId: number): Promise<any> {
    const reviews = await this.productReviewRepository.findByUserId(userId);

    const totalReviews = reviews.length;
    const activeReviews = reviews.filter((r) => r.isActive).length;

    let totalRating = 0;
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const review of reviews.filter((r) => r.isActive)) {
      totalRating += review.rating;
      ratingDistribution[review.rating]++;
    }

    const averageRating =
      activeReviews > 0
        ? parseFloat((totalRating / activeReviews).toFixed(1))
        : 0;

    const reviewsWithImages = reviews.filter((r) => r.imageUrl).length;
    const helpfulReviews = reviews.filter((r) => r.isActive).length;

    return {
      totalReviews,
      activeReviews,
      averageRating,
      ratingDistribution,
      reviewsWithImages,
      helpfulReviews,
    };
  }

  async getProductReviewStats(productId: number) {
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    const ratingInfo =
      await this.productReviewRepository.getProductAverageRating(productId);
    const distribution = await this.getRatingDistribution(productId);

    const recentReviews = await this.productReviewRepository.findByProductId(
      productId,
      {
        limit: 5,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "user",
            attributes: ["id", "name"],
          },
        ],
      },
    );

    const reviewsWithImages = (
      await this.productReviewRepository.findByProductId(productId)
    ).filter((r) => r.imageUrl).length;

    return {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      ratingInfo: {
        average: parseFloat(ratingInfo.average.toFixed(1)),
        count: ratingInfo.count,
        distribution,
      },
      recentReviews,
      additionalStats: {
        reviewsWithImages,
        helpfulReviews: ratingInfo.count,
      },
    };
  }

  async markReviewAsHelpful(
    reviewId: number,
    userId: number,
  ): Promise<boolean> {
    const review = await this.productReviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    if (!review.isActive) {
      throw new ValidationError("Esta avaliação não está mais disponível");
    }

    return true;
  }

  async reportReview(
    reviewId: number,
    userId: number,
    reason: string,
    details?: string,
  ) {
    const review = await this.productReviewRepository.findById(reviewId, {
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    if (review.userId === userId) {
      throw new ValidationError(
        "Não é possível reportar sua própria avaliação",
      );
    }

    if (!review.isActive) {
      throw new ValidationError("Esta avaliação já foi removida");
    }

    return {
      reviewId,
      reportedBy: userId,
      reason,
      details,
      timestamp: new Date(),
      status: "pending",
      message: "Report enviado para análise.",
    };
  }

  async getRecentReviews(limit: number = 20, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    return await this.productReviewRepository.findAll({
      include: [
        {
          association: "user",
          attributes: ["id", "name", "email"],
        },
        {
          association: "product",
          attributes: ["id", "name", "price"],
        },
      ],
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async getReviewById(
    reviewId: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    const review = await this.productReviewRepository.findById(reviewId, {
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
        },
        {
          association: "product",
          attributes: ["id", "name", "price"],
        },
      ],
    });

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    const isOwner = review.userId === currentUserId;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Acesso negado");
    }

    return review;
  }

  async toggleReviewStatus(
    reviewId: number,
    isActive: boolean,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    const review = await this.productReviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Avaliação não encontrada");
    }

    const affectedCount = await this.productReviewRepository.update(reviewId, {
      isActive,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao alterar status da avaliação", 500);
    }

    if (!isActive && review.imageUrl) {
      const filename = review.imageUrl.split("/").pop();
      if (filename) {
        await this.fileUploadService.deleteFile(filename);
      }
    }

    await this.updateProductAverageRating(review.productId);

    return await this.productReviewRepository.findById(reviewId, {
      include: [
        {
          association: "user",
          attributes: ["id", "name"],
        },
      ],
    });
  }
}
