import { FindOptions } from "sequelize";
import {
  Payment,
  PaymentAttributes,
  PaymentCreationAttributes,
  PaymentStatus,
  PaymentType,
} from "../models/PaymentModel";

export class PaymentRepository {
  async create(data: PaymentCreationAttributes): Promise<Payment> {
    return await Payment.create(data);
  }

  async findAll(options?: FindOptions): Promise<Payment[]> {
    return await Payment.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<Payment | null> {
    return await Payment.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<Payment | null> {
    return await Payment.findOne(options);
  }

  async findByOrderId(
    orderId: number,
    options?: FindOptions,
  ): Promise<Payment | null> {
    return await Payment.findOne({
      where: { orderId },
      ...options,
    });
  }

  async findByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<Payment[]> {
    return await Payment.findAll({
      where: { userId },
      ...options,
    });
  }

  async findByStatus(
    status: PaymentStatus,
    options?: FindOptions,
  ): Promise<Payment[]> {
    return await Payment.findAll({
      where: { status },
      ...options,
    });
  }

  async findByType(
    type: PaymentType,
    options?: FindOptions,
  ): Promise<Payment[]> {
    return await Payment.findAll({
      where: { type },
      ...options,
    });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await Payment.findOne({
      where: { transactionId },
    });
  }

  async update(id: number, data: Partial<PaymentAttributes>): Promise<number> {
    const [affectedCount] = await Payment.update(data, {
      where: { id },
    });
    return affectedCount;
  }

  async updateByOrderId(
    orderId: number,
    data: Partial<PaymentAttributes>,
  ): Promise<number> {
    const [affectedCount] = await Payment.update(data, {
      where: { orderId },
    });
    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await Payment.destroy({
      where: { id },
    });
  }
}
