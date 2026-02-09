import { FindOptions, Op } from "sequelize";
import {
  Product,
  ProductAttributes,
  ProductCreationAttributes,
} from "../models/ProductModel";
import sequelize from "../config/database";

export class ProductRepository {
  async create(data: ProductCreationAttributes): Promise<Product> {
    return await Product.create(data);
  }

  async findAll(options?: FindOptions): Promise<Product[]> {
    return await Product.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Product | null> {
    return await Product.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<Product | null> {
    return await Product.findOne(options);
  }

  async findByCategory(
    categoryId: number,
    options?: FindOptions,
  ): Promise<Product[]> {
    return await Product.findAll({
      where: { categoryId },
      ...options,
    });
  }

  async searchByNameOrDescription(searchTerm: string): Promise<Product[]> {
    const lowercaseTerm = searchTerm.toLowerCase();

    return await Product.findAll({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn("LOWER", sequelize.col("name")), {
            [Op.like]: `%${lowercaseTerm}%`,
          }),
          sequelize.where(sequelize.fn("LOWER", sequelize.col("description")), {
            [Op.like]: `%${lowercaseTerm}%`,
          }),
        ],
      },
    });
  }

  async update(id: number, data: Partial<ProductAttributes>): Promise<number> {
    const [affectedCount] = await Product.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await Product.destroy({
      where: { id },
    });
  }
}
