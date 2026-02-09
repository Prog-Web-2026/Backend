import { FindOptions } from "sequelize";
import {
  OrderItem,
  OrderItemAttributes,
  OrderItemCreationAttributes,
} from "../models/OrderItemModel";

export class OrderItemRepository {
  async create(data: OrderItemCreationAttributes): Promise<OrderItem> {
    return await OrderItem.create(data);
  }

  async createMany(items: OrderItemCreationAttributes[]): Promise<OrderItem[]> {
    return await OrderItem.bulkCreate(items);
  }

  async findAll(options?: FindOptions): Promise<OrderItem[]> {
    return await OrderItem.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<OrderItem | null> {
    return await OrderItem.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<OrderItem | null> {
    return await OrderItem.findOne(options);
  }

  async findByOrderId(
    orderId: number,
    options?: FindOptions,
  ): Promise<OrderItem[]> {
    return await OrderItem.findAll({
      where: { orderId },
      ...options,
    });
  }

  async update(
    id: number,
    data: Partial<OrderItemAttributes>,
  ): Promise<number> {
    const [affectedCount] = await OrderItem.update(data, {
      where: { id },
    });
    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await OrderItem.destroy({
      where: { id },
    });
  }

  async deleteByOrderId(orderId: number): Promise<number> {
    return await OrderItem.destroy({
      where: { orderId },
    });
  }
}
