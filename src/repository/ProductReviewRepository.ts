import { FindOptions, fn, col } from "sequelize";
import {
  ProductReview,
  ProductReviewAttributes,
  ProductReviewCreationAttributes,
} from "../models/ProductReviewModel";

export class ProductReviewRepository {
  async create(data: ProductReviewCreationAttributes): Promise<ProductReview> {
    return await ProductReview.create(data);
  }

  async findAll(options?: FindOptions): Promise<ProductReview[]> {
    return await ProductReview.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions,
  ): Promise<ProductReview | null> {
    return await ProductReview.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<ProductReview | null> {
    return await ProductReview.findOne(options);
  }

  async findByProductId(
    productId: number,
    options?: FindOptions,
  ): Promise<ProductReview[]> {
    return await ProductReview.findAll({
      where: { productId, isActive: true },
      ...options,
    });
  }

  async findByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<ProductReview[]> {
    return await ProductReview.findAll({
      where: { userId },
      ...options,
    });
  }

  async findUserReviewForProduct(
    userId: number,
    productId: number,
  ): Promise<ProductReview | null> {
    return await ProductReview.findOne({
      where: { userId, productId },
    });
  }

  async getProductAverageRating(
    productId: number,
  ): Promise<{ average: number; count: number }> {
    const result = (await ProductReview.findOne({
      where: { productId, isActive: true },
      attributes: [
        [fn("AVG", col("rating")), "average"],
        [fn("COUNT", col("id")), "count"],
      ],
      raw: true,
    })) as unknown as { average: string | null; count: string | null };

    return {
      average: result?.average ? Number(result.average) : 0,
      count: result?.count ? Number(result.count) : 0,
    };
  }

  async update(
    id: number,
    data: Partial<ProductReviewAttributes>,
  ): Promise<number> {
    const [affectedCount] = await ProductReview.update(data, {
      where: { id },
    });
    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await ProductReview.destroy({
      where: { id },
    });
  }
}
