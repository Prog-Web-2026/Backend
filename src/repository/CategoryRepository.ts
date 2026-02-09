import { FindOptions } from "sequelize";
import {
  Category,
  CategoryAttributes,
  CategoryCreationAttributes,
} from "../models/CategoryModel";

export class CategoryRepository {
  async create(data: CategoryCreationAttributes): Promise<Category> {
    return await Category.create(data);
  }

  async findAll(options?: FindOptions): Promise<Category[]> {
    return await Category.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Category | null> {
    return await Category.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<Category | null> {
    return await Category.findOne(options);
  }

  async findByName(name: string): Promise<Category | null> {
    return await Category.findOne({ where: { name } });
  }

  async update(id: number, data: Partial<CategoryAttributes>): Promise<number> {
    const [affectedCount] = await Category.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await Category.destroy({
      where: { id },
    });
  }
}
