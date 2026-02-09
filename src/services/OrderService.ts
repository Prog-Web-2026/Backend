import { OrderRepository } from "../repository/OrderRepository";
import { OrderItemRepository } from "../repository/OrderItemRepository";
import { ProductRepository } from "../repository/ProductRepository";
import { UserRepository } from "../repository/UserRepository";
import { DeliveryAssignmentRepository } from "../repository/DeliveryAssignmentRepository";
import { GeolocationService } from "./GeolocationService";
import { CartService } from "./CartService";
import { PaymentService } from "./PaymentService";
import { OrderAttributes, OrderStatus } from "../models/OrderModel";
import { UserRole } from "../models/UserModel";
import { AssignmentStatus } from "../models/DeliveryAssignmentModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../config/ErrorHandler";

export class OrderService {
  private orderRepository = new OrderRepository();
  private orderItemRepository = new OrderItemRepository();
  private productRepository = new ProductRepository();
  private userRepository = new UserRepository();
  private deliveryAssignmentRepository = new DeliveryAssignmentRepository();
  private geolocationService = new GeolocationService();
  private paymentService = new PaymentService();

  async createOrderFromSelectedItems(
    userId: number,
    selectedCartItemIds: number[],
    notes?: string,
    currentUserRole: UserRole = UserRole.CUSTOMER,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError("Apenas clientes podem criar pedidos");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!user.address || !user.address.latitude || !user.address.longitude) {
      throw new ValidationError(
        "Usuário não tem endereço completo cadastrado. Atualize seu endereço.",
      );
    }

    const cartService = new CartService();
    const checkoutResult = await cartService.checkoutSelectedItems(
      userId,
      selectedCartItemIds,
    );

    if (checkoutResult.items.length === 0) {
      throw new ValidationError("Nenhum item válido para checkout");
    }

    const totalAmount = checkoutResult.subtotal;

    const order = await this.orderRepository.create({
      userId,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryLatitude: user.address.latitude,
      deliveryLongitude: user.address.longitude,
      notes,
    });

    for (const item of checkoutResult.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) continue;

      await this.orderItemRepository.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.itemTotal,
      });

      const newStock = product.stock - item.quantity;
      await this.productRepository.update(item.productId, { stock: newStock });
    }

    await cartService.removeSelectedItemsAfterCheckout(
      userId,
      selectedCartItemIds,
    );

    return {
      order: await this.getOrderById(order.id, userId, currentUserRole),
      address: user.address,
    };
  }

  private async assignDeliveryPerson(orderId: number) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.status !== OrderStatus.PENDING) {
      return;
    }

    const deliveryPersons = await this.userRepository.findDeliveryPersons();

    if (deliveryPersons.length === 0) {
      return;
    }

    const targetLocation = {
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude,
    };

    const nearbyDeliveryPersons =
      this.geolocationService.findNearbyDeliveryPersons(
        deliveryPersons,
        targetLocation,
        20,
      );

    if (nearbyDeliveryPersons.length === 0) {
      return;
    }

    const topDeliveryPersons = nearbyDeliveryPersons.slice(0, 3);

    for (const { id: deliveryId, distance } of topDeliveryPersons) {
      const estimatedTime =
        this.geolocationService.estimateDeliveryTime(distance);

      await this.deliveryAssignmentRepository.create({
        orderId,
        deliveryId,
        distance,
        estimatedTime,
        assignedAt: new Date(),
        status: "pending" as AssignmentStatus,
      });
    }

    await this.orderRepository.update(orderId, {
      status: OrderStatus.CONFIRMED,
    });
  }

  async getOrderById(
    orderId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const order = await this.orderRepository.findById(orderId, {
      include: [
        { association: "user" },
        { association: "items", include: [{ association: "product" }] },
        { association: "payments" },
        { association: "deliveryAssignments" },
      ],
    });

    if (!order) {
      throw new NotFoundError("Pedido não encontrado");
    }

    if (
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.DELIVERY
    ) {
      if (order.userId !== userId) {
        throw new ForbiddenError("Acesso negado");
      }
    }

    return order;
  }

  async getUserOrders(
    userId: number,
    currentUserRole: UserRole,
    filters?: {
      status?: OrderStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    if (currentUserRole === UserRole.CUSTOMER) {
      const options: any = {
        where: { userId },
        include: [
          {
            association: "user",
            attributes: ["id", "name", "email", "address"],
          },
          {
            association: "items",
            include: [{ association: "product" }],
          },
          {
            association: "payment",
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      if (filters) {
        if (filters.status) options.where.status = filters.status;
        if (filters.limit) options.limit = filters.limit;
        if (filters.offset) options.offset = filters.offset;
      }

      return await this.orderRepository.findByUserId(userId, options);
    } else if (currentUserRole === UserRole.DELIVERY) {
      const options: any = {
        where: { deliveryId: userId },
        include: [
          {
            association: "user",
            attributes: ["id", "name", "email", "phone", "address"],
          },
          {
            association: "items",
            include: [{ association: "product" }],
          },
          {
            association: "payment",
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      if (filters) {
        if (filters.status) options.where.status = filters.status;
        if (filters.limit) options.limit = filters.limit;
        if (filters.offset) options.offset = filters.offset;
      }

      return await this.orderRepository.findByDeliveryId(userId, options);
    } else if (currentUserRole === UserRole.ADMIN) {
      const options: any = {
        include: [
          {
            association: "user",
            attributes: ["id", "name", "email", "address"],
          },
          {
            association: "deliveryPerson",
            attributes: ["id", "name", "email"],
          },
          {
            association: "items",
            include: [{ association: "product" }],
          },
          {
            association: "payment",
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      if (filters) {
        if (filters.status) options.where = { status: filters.status };
        if (filters.limit) options.limit = filters.limit;
        if (filters.offset) options.offset = filters.offset;
      }

      return await this.orderRepository.findAll(options);
    }

    throw new ForbiddenError("Acesso negado");
  }

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Pedido não encontrado");
    }

    const validTransitions = this.getValidStatusTransitions(
      order.status,
      currentUserRole,
      order.deliveryId === userId,
    );

    if (!validTransitions.includes(status)) {
      throw new ForbiddenError(
        `Transição de status não permitida de ${order.status} para ${status}`,
      );
    }

    const updateData: Partial<OrderAttributes> = { status };

    if (status === OrderStatus.ON_THE_WAY && !order.estimatedDeliveryTime) {
      const deliveryPerson = await this.userRepository.findById(
        order.deliveryId!,
      );
      if (deliveryPerson?.latitude && deliveryPerson.longitude) {
        const distance = this.geolocationService.calculateDistance(
          {
            latitude: deliveryPerson.latitude,
            longitude: deliveryPerson.longitude,
          },
          {
            latitude: order.deliveryLatitude,
            longitude: order.deliveryLongitude,
          },
        );

        const estimatedMinutes =
          this.geolocationService.estimateDeliveryTime(distance);
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);

        updateData.estimatedDeliveryTime = estimatedTime;
      }
    }

    if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    const affectedCount = await this.orderRepository.update(
      orderId,
      updateData,
    );

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar status do pedido", 500);
    }

    if (status === OrderStatus.CANCELLED || status === OrderStatus.DELIVERED) {
      const assignments =
        await this.deliveryAssignmentRepository.findByOrderId(orderId);
      for (const assignment of assignments) {
        await this.deliveryAssignmentRepository.update(assignment.id, {
          status: (status === OrderStatus.CANCELLED
            ? "cancelled"
            : "accepted") as AssignmentStatus,
        });
      }
    }

    return await this.getOrderById(orderId, userId, currentUserRole);
  }

  private getValidStatusTransitions(
    currentStatus: OrderStatus,
    userRole: UserRole,
    isAssignedDelivery: boolean,
  ): OrderStatus[] {
    const baseTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_DELIVERY]: [
        OrderStatus.ON_THE_WAY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    let validTransitions = baseTransitions[currentStatus];

    if (userRole === UserRole.ADMIN) {
      return validTransitions;
    } else if (userRole === UserRole.DELIVERY && isAssignedDelivery) {
      if (currentStatus === OrderStatus.READY_FOR_DELIVERY) {
        return [OrderStatus.ON_THE_WAY];
      } else if (currentStatus === OrderStatus.ON_THE_WAY) {
        return [OrderStatus.DELIVERED];
      }
      return [];
    } else if (userRole === UserRole.CUSTOMER) {
      if (
        currentStatus === OrderStatus.PENDING ||
        currentStatus === OrderStatus.CONFIRMED
      ) {
        return [OrderStatus.CANCELLED];
      }
      return [];
    }

    return [];
  }

  async respondToDeliveryAssignment(
    assignmentId: number,
    deliveryId: number,
    accept: boolean,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.DELIVERY) {
      throw new ForbiddenError(
        "Apenas entregadores podem responder a atribuições",
      );
    }

    const assignment = await this.deliveryAssignmentRepository.findById(
      assignmentId,
      {
        include: [{ association: "order" }],
      },
    );

    if (!assignment) {
      throw new NotFoundError("Atribuição não encontrada");
    }

    if (assignment.deliveryId !== deliveryId) {
      throw new ForbiddenError("Esta atribuição não é para você");
    }

    if (assignment.status !== "pending") {
      throw new ValidationError("Esta atribuição já foi respondida");
    }

    const order = assignment.order;
    if (!order || order.status !== OrderStatus.CONFIRMED) {
      throw new ValidationError("Pedido não está mais disponível para entrega");
    }

    const newStatus = accept ? "accepted" : "rejected";
    await this.deliveryAssignmentRepository.updateStatus(
      assignmentId,
      newStatus as AssignmentStatus,
    );

    if (accept) {
      await this.orderRepository.update(order.id, {
        deliveryId,
        status: OrderStatus.PREPARING,
      });

      const otherAssignments =
        await this.deliveryAssignmentRepository.findByOrderId(order.id);

      for (const otherAssignment of otherAssignments) {
        if (
          otherAssignment.id !== assignmentId &&
          otherAssignment.status === "pending"
        ) {
          await this.deliveryAssignmentRepository.updateStatus(
            otherAssignment.id,
            "rejected" as AssignmentStatus,
          );
        }
      }
    }

    return {
      assignment: await this.deliveryAssignmentRepository.findById(
        assignmentId,
        {
          include: [
            { association: "order" },
            { association: "deliveryPerson" },
          ],
        },
      ),
      order: accept
        ? await this.getOrderById(order.id, deliveryId, currentUserRole)
        : null,
    };
  }

  async getPendingDeliveryAssignments(
    deliveryId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.DELIVERY) {
      throw new ForbiddenError(
        "Apenas entregadores podem ver atribuições pendentes",
      );
    }

    return await this.deliveryAssignmentRepository.findPendingByDeliveryId(
      deliveryId,
      {
        include: [
          {
            association: "order",
            include: [
              {
                association: "user",
                attributes: ["id", "name", "email", "phone", "address"],
              },
              {
                association: "items",
                include: [{ association: "product" }],
              },
            ],
          },
        ],
      },
    );
  }

  async cancelOrder(
    orderId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const order = await this.orderRepository.findById(orderId, {
      include: [{ association: "items" }, { association: "payment" }],
    });

    if (!order) {
      throw new NotFoundError("Pedido não encontrado");
    }

    const canCancel =
      currentUserRole === UserRole.ADMIN ||
      (currentUserRole === UserRole.CUSTOMER &&
        order.userId === userId &&
        (order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.CONFIRMED));

    if (!canCancel) {
      throw new ForbiddenError("Não é possível cancelar este pedido");
    }

    for (const item of order.items || []) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        await this.productRepository.update(item.productId, {
          stock: newStock,
        });
      }
    }

    if (order.payment && order.payment.status === "success") {
      await this.paymentService.refundPayment(
        order.payment.id,
        currentUserRole,
        "Pedido cancelado pelo usuário",
      );
    }

    return await this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      userId,
      currentUserRole,
    );
  }

  async processOrderPayment(
    orderId: number,
    userId: number,
    paymentData: any,
    currentUserRole: UserRole,
  ) {
    const result = await this.paymentService.processPayment(
      orderId,
      userId,
      paymentData,
      currentUserRole,
    );

    if (result.payment.status === "success") {
      await this.assignDeliveryPerson(orderId);
    }

    return result;
  }

  async getOrderStatistics(userId: number, currentUserRole: UserRole) {
    if (
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.DELIVERY
    ) {
      throw new ForbiddenError("Acesso negado");
    }

    const where: any = {};

    if (currentUserRole === UserRole.DELIVERY) {
      where.deliveryId = userId;
    }

    const allOrders = await this.orderRepository.findAll({ where });

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === OrderStatus.PENDING).length,
      confirmed: allOrders.filter((o) => o.status === OrderStatus.CONFIRMED)
        .length,
      preparing: allOrders.filter((o) => o.status === OrderStatus.PREPARING)
        .length,
      readyForDelivery: allOrders.filter(
        (o) => o.status === OrderStatus.READY_FOR_DELIVERY,
      ).length,
      onTheWay: allOrders.filter((o) => o.status === OrderStatus.ON_THE_WAY)
        .length,
      delivered: allOrders.filter((o) => o.status === OrderStatus.DELIVERED)
        .length,
      cancelled: allOrders.filter((o) => o.status === OrderStatus.CANCELLED)
        .length,
      totalRevenue: allOrders
        .filter((o) => o.status === OrderStatus.DELIVERED)
        .reduce(
          (sum, order) => sum + parseFloat(order.totalAmount.toString()),
          0,
        ),
    };

    return stats;
  }
}
