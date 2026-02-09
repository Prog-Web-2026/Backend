import { FindOptions } from "sequelize";
import {
  DeliveryAssignment,
  DeliveryAssignmentAttributes,
  DeliveryAssignmentCreationAttributes,
  AssignmentStatus,
} from "../models/DeliveryAssignmentModel";

export class DeliveryAssignmentRepository {
  async create(
    data: DeliveryAssignmentCreationAttributes,
  ): Promise<DeliveryAssignment> {
    return await DeliveryAssignment.create(data);
  }

  async findAll(options?: FindOptions): Promise<DeliveryAssignment[]> {
    return await DeliveryAssignment.findAll(options);
  }

  async findById(
    id: number,
    options?: FindOptions,
  ): Promise<DeliveryAssignment | null> {
    return await DeliveryAssignment.findByPk(id, options);
  }

  async findOne(options: FindOptions): Promise<DeliveryAssignment | null> {
    return await DeliveryAssignment.findOne(options);
  }

  async findByOrderId(
    orderId: number,
    options?: FindOptions,
  ): Promise<DeliveryAssignment[]> {
    return await DeliveryAssignment.findAll({
      where: { orderId },
      ...options,
    });
  }

  async findByDeliveryId(
    deliveryId: number,
    options?: FindOptions,
  ): Promise<DeliveryAssignment[]> {
    return await DeliveryAssignment.findAll({
      where: { deliveryId },
      ...options,
    });
  }

  async findPendingByDeliveryId(
    deliveryId: number,
    options?: FindOptions,
  ): Promise<DeliveryAssignment[]> {
    return await DeliveryAssignment.findAll({
      where: {
        deliveryId,
        status: AssignmentStatus.PENDING,
      },
      ...options,
    });
  }

  async findByOrderAndDelivery(
    orderId: number,
    deliveryId: number,
  ): Promise<DeliveryAssignment | null> {
    return await DeliveryAssignment.findOne({
      where: { orderId, deliveryId },
    });
  }

  async update(
    id: number,
    data: Partial<DeliveryAssignmentAttributes>,
  ): Promise<number> {
    const [affectedCount] = await DeliveryAssignment.update(data, {
      where: { id },
    });
    return affectedCount;
  }

  async updateStatus(id: number, status: AssignmentStatus): Promise<number> {
    const [affectedCount] = await DeliveryAssignment.update(
      {
        status,
        respondedAt:
          status !== AssignmentStatus.PENDING ? new Date() : undefined,
      },
      { where: { id } },
    );
    return affectedCount;
  }

  async delete(id: number): Promise<number> {
    return await DeliveryAssignment.destroy({
      where: { id },
    });
  }
}
