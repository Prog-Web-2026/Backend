import { PaymentRepository } from "../repository/PaymentRepository";
import { OrderRepository } from "../repository/OrderRepository";
import {
  PaymentCreationAttributes,
  PaymentStatus,
  PaymentType,
} from "../models/PaymentModel";
import { OrderStatus } from "../models/OrderModel";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../config/ErrorHandler";

export class PaymentService {
  private paymentRepository = new PaymentRepository();
  private orderRepository = new OrderRepository();

  async processPayment(
    orderId: number,
    userId: number,
    paymentData: {
      type: PaymentType;
    },
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError("Apenas clientes podem processar pagamentos");
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError("Pedido não encontrado");
    }

    if (order.userId !== userId) {
      throw new ForbiddenError("Acesso negado");
    }

    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new ConflictError("Este pedido já foi pago");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictError("Este pedido foi cancelado");
    }

    const paymentAttributes: PaymentCreationAttributes = {
      orderId,
      userId,
      amount: order.totalAmount,
      type: paymentData.type,
      status: PaymentStatus.SUCCESS,
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
      paidAt: new Date(),
    };

    const payment = await this.paymentRepository.create(paymentAttributes);

    await this.orderRepository.update(orderId, {
      status: OrderStatus.CONFIRMED,
    });

    return {
      payment,
      order: await this.orderRepository.findById(orderId),
    };
  }

  async getPaymentById(id: number, userId: number, currentUserRole: UserRole) {
    const payment = await this.paymentRepository.findById(id, {
      include: [{ association: "order" }],
    });

    if (!payment) {
      throw new NotFoundError("Pagamento não encontrado");
    }

    if (payment.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    return payment;
  }

  async getPaymentByOrderId(
    orderId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const payment = await this.paymentRepository.findByOrderId(orderId, {
      include: [{ association: "order" }],
    });

    if (!payment) {
      throw new NotFoundError("Pagamento não encontrado para este pedido");
    }

    if (payment.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    return payment;
  }

  async getUserPayments(userId: number, currentUserRole: UserRole) {
    if (
      currentUserRole !== UserRole.CUSTOMER &&
      currentUserRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenError("Acesso negado");
    }

    return await this.paymentRepository.findByUserId(userId, {
      include: [{ association: "order" }],
      order: [["createdAt", "DESC"]],
    });
  }

  async refundPayment(paymentId: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        "Apenas administradores podem estornar pagamentos",
      );
    }

    const payment = await this.paymentRepository.findById(paymentId, {
      include: [{ association: "order" }],
    });

    if (!payment) {
      throw new NotFoundError("Pagamento não encontrado");
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new ValidationError(
        "Apenas pagamentos com sucesso podem ser estornados",
      );
    }

    const affectedCount = await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao estornar pagamento", 500);
    }

    await this.orderRepository.update(payment.orderId, {
      status: OrderStatus.CANCELLED,
    });

    return await this.paymentRepository.findById(paymentId, {
      include: [{ association: "order" }],
    });
  }
}
