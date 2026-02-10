import { OrderRepository } from "../repository/OrderRepository";
import { OrderItemRepository } from "../repository/OrderItemRepository";
import { ProductRepository } from "../repository/ProductRepository";
import { UserRepository } from "../repository/UserRepository";
import { CartService } from "./CartService";
import { PaymentService } from "./PaymentService";
import { OrderAttributes, OrderStatus } from "../models/OrderModel";
import { UserRole } from "../models/UserModel";
import { PaymentType } from "../models/PaymentModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../config/ErrorHandler";

export class OrderService {
  private orderRepository = new OrderRepository();
  private orderItemRepository = new OrderItemRepository();
  private productRepository = new ProductRepository();
  private userRepository = new UserRepository();
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

    if (!user.address) {
      throw new ValidationError(
        "Usuário não tem endereço cadastrado. Atualize seu endereço.",
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

    const address = user.address;
    const deliveryAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood}, ${address.city} - ${address.state}, ${address.zipCode}`;

    const order = await this.orderRepository.create({
      userId,
      totalAmount,
      status: OrderStatus.PENDING,
      deliveryAddress,
      deliveryLatitude: address.latitude,
      deliveryLongitude: address.longitude,
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

  async getOrderById(
    orderId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const order = await this.orderRepository.findById(orderId, {
      include: [
        { association: "customer" },
        { association: "deliveryPerson" },
        { association: "items", include: [{ association: "product" }] },
        { association: "payment" },
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
    const baseInclude = [
      {
        association: "customer",
        attributes: ["id", "name", "email", "address"],
      },
      { association: "items", include: [{ association: "product" }] },
      { association: "payment" },
    ];

    if (currentUserRole === UserRole.CUSTOMER) {
      const options: any = {
        where: { userId },
        include: baseInclude,
        order: [["createdAt", "DESC"]],
      };

      if (filters?.status) options.where.status = filters.status;
      if (filters?.limit) options.limit = filters.limit;
      if (filters?.offset) options.offset = filters.offset;

      return await this.orderRepository.findByUserId(userId, options);
    } else if (currentUserRole === UserRole.DELIVERY) {
      const options: any = {
        where: { deliveryId: userId },
        include: [
          ...baseInclude,
          {
            association: "deliveryPerson",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      if (filters?.status) options.where.status = filters.status;
      if (filters?.limit) options.limit = filters.limit;
      if (filters?.offset) options.offset = filters.offset;

      return await this.orderRepository.findByDeliveryId(userId, options);
    } else if (currentUserRole === UserRole.ADMIN) {
      const options: any = {
        include: [
          ...baseInclude,
          {
            association: "deliveryPerson",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      if (filters?.status) options.where = { status: filters.status };
      if (filters?.limit) options.limit = filters.limit;
      if (filters?.offset) options.offset = filters.offset;

      return await this.orderRepository.findAll(options);
    }

    throw new ForbiddenError("Acesso negado");
  }

  async getAvailableOrdersForDelivery(currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.DELIVERY) {
      throw new ForbiddenError(
        "Apenas entregadores podem ver pedidos disponíveis",
      );
    }

    return await this.orderRepository.findOrdersReadyForDelivery();
  }

  async acceptOrderForDelivery(
    orderId: number,
    deliveryId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.DELIVERY) {
      throw new ForbiddenError("Apenas entregadores podem aceitar pedidos");
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Pedido não encontrado");
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new ConflictError("Pedido não está disponível para entrega");
    }

    if (order.deliveryId !== null) {
      throw new ConflictError("Pedido já foi aceito por outro entregador");
    }

    await this.orderRepository.update(orderId, {
      deliveryId,
      status: OrderStatus.OUT_FOR_DELIVERY,
    });

    return await this.getOrderById(orderId, deliveryId, currentUserRole);
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

    return await this.getOrderById(orderId, userId, currentUserRole);
  }

  private getValidStatusTransitions(
    currentStatus: OrderStatus,
    userRole: UserRole,
    isAssignedDelivery: boolean,
  ): OrderStatus[] {
    const adminTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_PICKUP]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (userRole === UserRole.ADMIN) {
      return adminTransitions[currentStatus];
    } else if (userRole === UserRole.DELIVERY && isAssignedDelivery) {
      if (currentStatus === OrderStatus.OUT_FOR_DELIVERY) {
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
      await this.paymentService.refundPayment(order.payment.id, UserRole.ADMIN);
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
    paymentData: { type: PaymentType },
    currentUserRole: UserRole,
  ) {
    return await this.paymentService.processPayment(
      orderId,
      userId,
      paymentData,
      currentUserRole,
    );
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
      readyForPickup: allOrders.filter(
        (o) => o.status === OrderStatus.READY_FOR_PICKUP,
      ).length,
      outForDelivery: allOrders.filter(
        (o) => o.status === OrderStatus.OUT_FOR_DELIVERY,
      ).length,
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
