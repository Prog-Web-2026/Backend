import { FindOptions } from "sequelize";
import {
  PaymentMethod,
  PaymentMethodAttributes,
  PaymentMethodCreationAttributes,
  PaymentMethodType,
} from "../models/PaymentMethodModel";

export class PaymentMethodRepository {
  async create(data: PaymentMethodCreationAttributes): Promise<PaymentMethod> {
    return await PaymentMethod.create(data);
  }

  async findAll(options?: FindOptions): Promise<PaymentMethod[]> {
    return await PaymentMethod.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions,
  ): Promise<PaymentMethod | null> {
    return await PaymentMethod.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<PaymentMethod | null> {
    return await PaymentMethod.findOne(options);
  }

  async findByUserId(
    userId: number,
    options?: FindOptions,
  ): Promise<PaymentMethod[]> {
    return await PaymentMethod.findAll({
      where: { userId, isActive: true },
      ...options,
    });
  }

  async findUserDefaultPaymentMethod(
    userId: number,
    type?: PaymentMethodType,
  ): Promise<PaymentMethod | null> {
    const where: any = { userId, isDefault: true, isActive: true };

    if (type) {
      where.type = type;
    }

    return await PaymentMethod.findOne({ where });
  }

  async findByUserIdAndType(
    userId: number,
    type: PaymentMethodType,
  ): Promise<PaymentMethod[]> {
    return await PaymentMethod.findAll({
      where: { userId, type, isActive: true },
    });
  }

  async update(
    id: number,
    data: Partial<PaymentMethodAttributes>,
  ): Promise<number> {
    const [affectedCount] = await PaymentMethod.update(data, {
      where: { id },
    });

    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await PaymentMethod.destroy({
      where: { id },
    });
  }

  async setAsDefault(userId: number, paymentMethodId: number): Promise<void> {
    await PaymentMethod.update({ isDefault: false }, { where: { userId } });

    await PaymentMethod.update(
      { isDefault: true },
      { where: { id: paymentMethodId, userId } },
    );
  }
}
