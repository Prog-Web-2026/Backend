import { ProductRepository } from "../repository/ProductRepository";
import { CategoryRepository } from "../repository/CategoryRepository";
import { ProductReviewRepository } from "../repository/ProductReviewRepository";
import { FileUploadService } from "./FileUploadService";
import {
  ProductAttributes,
  ProductCreationAttributes,
} from "../models/ProductModel";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../config/ErrorHandler";

export class ProductService {
  private productRepository = new ProductRepository();
  private categoryRepository = new CategoryRepository();
  private productReviewRepository = new ProductReviewRepository();
  private fileUploadService = new FileUploadService();

  async createProduct(
    data: ProductCreationAttributes,
    imageFile?: Express.Multer.File,
    currentUserRole?: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem criar produtos");
    }

    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }

    if (imageFile) {
      this.fileUploadService.validateImageFile(imageFile);
      data.imageUrl = this.fileUploadService.getFileUrl(imageFile.filename);
    }

    if (data.price <= 0) {
      throw new ValidationError("O preço deve ser maior que zero");
    }

    if (data.stock < 0) {
      throw new ValidationError("O estoque não pode ser negativo");
    }

    return await this.productRepository.create(data);
  }

  async getAllProducts(filters?: {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    search?: string;
  }) {
    const options: any = {
      where: { isActive: true },
      include: [{ association: "category" }],
    };

    if (filters) {
      if (filters.categoryId) {
        options.where.categoryId = filters.categoryId;
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        options.where.price = {};
        if (filters.minPrice !== undefined)
          options.where.price.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
          options.where.price.$lte = filters.maxPrice;
      }

      if (filters.inStock === true) {
        options.where.stock = { $gt: 0 };
      } else if (filters.inStock === false) {
        options.where.stock = 0;
      }

      if (filters.search) {
        const searchResults =
          await this.productRepository.searchByNameOrDescription(
            filters.search,
          );
        return searchResults.filter((product) => product.isActive);
      }
    }

    return await this.productRepository.findAll(options);
  }

  async getProductById(id: number, includeReviews: boolean = false) {
    const options: any = {
      include: [{ association: "category" }],
    };

    const product = await this.productRepository.findById(id, options);

    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    if (includeReviews) {
      const reviews = await this.productReviewRepository.findByProductId(
        product.id,
        {
          include: [{ association: "user", attributes: ["id", "name"] }],
        },
      );

      const ratingInfo =
        await this.productReviewRepository.getProductAverageRating(product.id);

      return {
        ...product.toJSON(),
        reviews,
        ratingInfo,
      };
    }

    return product;
  }

  async updateProduct(
    id: number,
    data: Partial<ProductAttributes>,
    imageFile?: Express.Multer.File,
    currentUserRole?: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem atualizar produtos",
      );
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }

    if (data.categoryId && data.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }
    }

    if (imageFile) {
      this.fileUploadService.validateImageFile(imageFile);

      if (product.imageUrl) {
        const oldFilename = product.imageUrl.split("/").pop();
        if (oldFilename) {
          await this.fileUploadService.deleteFile(oldFilename);
        }
      }

      data.imageUrl = this.fileUploadService.getFileUrl(imageFile.filename);
    }

    if (data.price !== undefined && data.price <= 0) {
      throw new ValidationError("O preço deve ser maior que zero");
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError("O estoque não pode ser negativo");
    }

    const affectedCount = await this.productRepository.update(id, data);

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar produto", 500);
    }

    return await this.productRepository.findById(id, {
      include: [{ association: "category" }],
    });
  }

  async deleteProduct(id: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem excluir produtos");
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }

    const affectedCount = await this.productRepository.update(id, {
      isActive: false,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao excluir produto", 500);
    }

    return true;
  }

  async updateStock(
    id: number,
    quantity: number,
    operation: "add" | "subtract" | "set",
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem atualizar estoque",
      );
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }

    let newStock = product.stock;

    switch (operation) {
      case "add":
        newStock += quantity;
        break;
      case "subtract":
        newStock = Math.max(0, newStock - quantity);
        break;
      case "set":
        if (quantity < 0) {
          throw new ValidationError("O estoque não pode ser negativo");
        }
        newStock = quantity;
        break;
    }

    const affectedCount = await this.productRepository.update(id, {
      stock: newStock,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar estoque", 500);
    }

    return await this.productRepository.findById(id);
  }

  async addProductReview(
    productId: number,
    userId: number,
    rating: number,
    comment?: string,
    imageFile?: Express.Multer.File,
  ) {
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    const existingReview =
      await this.productReviewRepository.findUserReviewForProduct(
        userId,
        productId,
      );
    if (existingReview) {
      throw new ConflictError("Você já avaliou este produto");
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      this.fileUploadService.validateImageFile(imageFile);
      imageUrl = this.fileUploadService.getFileUrl(imageFile.filename);
    }

    return await this.productReviewRepository.create({
      userId,
      productId,
      rating,
      comment,
      isActive: true,
    });
  }

  async getProductReviews(
    productId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    const offset = (page - 1) * limit;

    const reviews = await this.productReviewRepository.findByProductId(
      productId,
      {
        include: [{ association: "user", attributes: ["id", "name"] }],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      },
    );

    const total = (
      await this.productReviewRepository.findByProductId(productId)
    ).length;
    const ratingInfo =
      await this.productReviewRepository.getProductAverageRating(productId);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      ratingInfo,
    };
  }

  async getProductsByCategory(
    categoryId: number,
    includeInactive: boolean = false,
  ) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || (!includeInactive && !category.isActive)) {
      throw new NotFoundError("Categoria não encontrada");
    }

    const where: any = { categoryId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.productRepository.findByCategory(categoryId, {
      where,
      include: [{ association: "category" }],
    });
  }

  async searchProducts(searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError(
        "Termo de busca deve ter pelo menos 2 caracteres",
      );
    }

    const products =
      await this.productRepository.searchByNameOrDescription(searchTerm);
    return products.filter((product) => product.isActive);
  }
}
