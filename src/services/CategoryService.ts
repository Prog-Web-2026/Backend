import { CategoryRepository } from "../repository/CategoryRepository";
import { ProductRepository } from "../repository/ProductRepository";
import {
  CategoryAttributes,
  CategoryCreationAttributes,
} from "../models/CategoryModel";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../config/ErrorHandler";

export class CategoryService {
  private categoryRepository = new CategoryRepository();
  private productRepository = new ProductRepository();

  async createCategory(
    data: CategoryCreationAttributes,
    currentUserRole?: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Apenas administradores podem criar categorias");
    }

    const existingCategory = await this.categoryRepository.findByName(
      data.name,
    );
    if (existingCategory) {
      throw new ConflictError("Categoria com este nome já existe");
    }

    return await this.categoryRepository.create(data);
  }

  async getAllCategories(
    includeInactive: boolean = false,
    includeProducts: boolean = false,
  ) {
    const options: any = {};

    if (!includeInactive) {
      options.where = { isActive: true };
    }

    if (includeProducts) {
      options.include = [
        {
          association: "products",
          where: { isActive: true },
        },
      ];
    }

    const categories = await this.categoryRepository.findAll(options);

    if (includeProducts) {
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const products = await this.productRepository.findByCategory(
            category.id,
            {
              where: { isActive: true },
            },
          );

          return {
            ...category.toJSON(),
            productCount: products.length,
          };
        }),
      );

      return categoriesWithCount;
    }

    return categories;
  }

  async getCategoryById(id: number, includeProducts: boolean = false) {
    const options: any = {};

    if (includeProducts) {
      options.include = [
        {
          association: "products",
          where: { isActive: true },
        },
      ];
    }

    const category = await this.categoryRepository.findById(id, options);

    if (!category || !category.isActive) {
      throw new NotFoundError("Categoria não encontrada");
    }

    if (includeProducts) {
      const productCount = await this.productRepository
        .findByCategory(id, {
          where: { isActive: true },
        })
        .then((products) => products.length);

      return {
        ...category.toJSON(),
        productCount,
      };
    }

    return category;
  }

  async updateCategory(
    id: number,
    data: Partial<CategoryAttributes>,
    currentUserRole?: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem atualizar categorias",
      );
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }

    if (data.name && data.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(
        data.name,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictError("Categoria com este nome já existe");
      }
    }

    const affectedCount = await this.categoryRepository.update(id, data);

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar categoria", 500);
    }

    return await this.categoryRepository.findById(id);
  }

  async deleteCategory(id: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem excluir categorias",
      );
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }

    const activeProducts = await this.productRepository.findByCategory(id, {
      where: { isActive: true },
    });

    if (activeProducts.length > 0) {
      throw new ConflictError(
        `Não é possível excluir categoria com produtos ativos. 
        Existem ${activeProducts.length} produto(s) nesta categoria.`,
      );
    }

    const affectedCount = await this.categoryRepository.update(id, {
      isActive: false,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao excluir categoria", 500);
    }

    return true;
  }

  async toggleCategoryStatus(
    id: number,
    isActive: boolean,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem alterar o status de categorias",
      );
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }

    const affectedCount = await this.categoryRepository.update(id, {
      isActive,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao alterar status da categoria", 500);
    }

    return await this.categoryRepository.findById(id);
  }

  async getPopularCategories(limit: number = 5) {
    const categories = await this.categoryRepository.findAll({
      where: { isActive: true },
      include: [
        {
          association: "products",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    const sortedCategories = categories
      .map((category) => ({
        ...category.toJSON(),
        productCount: (category as any).products?.length || 0,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, limit);

    return sortedCategories;
  }

  async validateCategoryForProduct(categoryId: number): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    return !!category && category.isActive;
  }
}
