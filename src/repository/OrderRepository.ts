import { FindOptions, Op } from "sequelize";
import {
  Order,
  OrderAttributes,
  OrderCreationAttributes,
  OrderStatus,
} from "../models/OrderModel";

export class OrderRepository {
  async create(data: OrderCreationAttributes): Promise<Order> {
    return await Order.create(data);
  }

  async findAll(options?: FindOptions): Promise<Order[]> {
    return await Order.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Order | null> {
    return await Order.findByPk(id, {
      include: [
        { association: "customer" },
        { association: "deliveryPerson" },
        { association: "items", include: [{ association: "product" }] },
        { association: "payment" },
      ],
      ...options,
    });
  }

  async findOne(options: FindOptions): Promise<Order | null> {
    return await Order.findOne(options);
  }

  async findByUserId(userId: number, options?: FindOptions): Promise<Order[]> {
    return await Order.findAll({
      where: { userId },
      ...options,
    });
  }

  async findByDeliveryId(
    deliveryId: number,
    options?: FindOptions
  ): Promise<Order[]> {
    return await Order.findAll({
      where: { deliveryId },
      ...options,
    });
  }

  async findByStatus(
    status: OrderStatus,
    options?: FindOptions
  ): Promise<Order[]> {
    return await Order.findAll({
      where: { status },
      ...options,
    });
  }

  async findOrdersReadyForDelivery(): Promise<Order[]> {
    return await Order.findAll({
      where: {
        status: OrderStatus.READY_FOR_PICKUP,
        deliveryId: {
          [Op.is]: null,
        },
      },
      include: [
        { association: "customer", attributes: ["id", "name", "phone", "address"] },
        { association: "items", include: [{ association: "product" }] },
      ],
      order: [["createdAt", "ASC"]],
    });
  }

  async update(id: number, data: Partial<OrderAttributes>): Promise<number> {
    const [affectedCount] = await Order.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await Order.destroy({
      where: { id },
    });
  }
}
