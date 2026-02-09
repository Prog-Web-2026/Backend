import { FindOptions } from "sequelize";
import {
  Cart,
  CartAttributes,
  CartCreationAttributes,
} from "../models/CartModel";

export class CartRepository {
  async create(data: CartCreationAttributes): Promise<Cart> {
    return await Cart.create(data);
  }

  async findAll(options?: FindOptions): Promise<Cart[]> {
    return await Cart.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Cart | null> {
    return await Cart.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<Cart | null> {
    return await Cart.findOne(options);
  }

  async findByUserId(userId: number, options?: FindOptions): Promise<Cart[]> {
    return await Cart.findAll({
      where: { userId },
      ...options,
    });
  }

  async findUserCartItem(
    userId: number,
    productId: number,
  ): Promise<Cart | null> {
    return await Cart.findOne({
      where: { userId, productId },
    });
  }

  async update(id: number, data: Partial<CartAttributes>): Promise<number> {
    const [affectedCount] = await Cart.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async updateByUserAndProduct(
    userId: number,
    productId: number,
    data: Partial<CartAttributes>,
  ): Promise<number> {
    const [affectedCount] = await Cart.update(data, {
      where: { userId, productId },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await Cart.destroy({
      where: { id },
    });
  }

  async deleteByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<number> {
    return await Cart.destroy({
      where: { userId, productId },
    });
  }

  async clearUserCart(userId: number): Promise<number> {
    return await Cart.destroy({
      where: { userId },
    });
  }
}
