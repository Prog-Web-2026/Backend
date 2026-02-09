import { PaymentRepository } from "../repository/PaymentRepository";
import { PaymentMethodRepository } from "../repository/PaymentMethodRepository";
import { OrderRepository } from "../repository/OrderRepository";
import {
  PaymentCreationAttributes,
  PaymentStatus,
  PaymentType,
} from "../models/PaymentModel";
import { PaymentMethod } from "../models/PaymentMethodModel";
import { OrderStatus } from "../models/OrderModel";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../config/ErrorHandler";

export class PaymentService {
  private paymentRepository = new PaymentRepository();
  private paymentMethodRepository = new PaymentMethodRepository();
  private orderRepository = new OrderRepository();

  async processPayment(
    orderId: number,
    userId: number,
    paymentData: {
      type: PaymentType;
      paymentMethodId?: number;
      installments?: number;
      cardData?: {
        cardHolderName: string;
        cardNumber: string;
        cardExpiryMonth: number;
        cardExpiryYear: number;
        cardCvv: string;
      };
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

    if (order.paymentStatus === PaymentStatus.SUCCESS) {
      throw new ValidationError("Este pedido já foi pago");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ValidationError("Este pedido foi cancelado");
    }

    const installments = paymentData.installments || 1;
    if (installments < 1 || installments > 12) {
      throw new ValidationError("Número de parcelas inválido (1-12)");
    }

    if (paymentData.type === PaymentType.DEBIT_CARD && installments > 1) {
      throw new ValidationError("Cartão de débito não permite parcelamento");
    }

    let paymentMethod: PaymentMethod | null = null;
    let paymentDetails: any = {};

    switch (paymentData.type) {
      case PaymentType.CREDIT_CARD:
      case PaymentType.DEBIT_CARD:
        paymentDetails = await this.processCardPayment(paymentData);
        break;

      case PaymentType.PIX:
        paymentDetails = await this.processPixPayment(order.totalAmount);
        break;

      case PaymentType.BOLETO:
        paymentDetails = await this.processBoletoPayment(order.totalAmount);
        break;

      default:
        throw new ValidationError("Tipo de pagamento inválido");
    }

    if (paymentData.paymentMethodId) {
      paymentMethod = await this.paymentMethodRepository.findById(
        paymentData.paymentMethodId,
      );
      if (paymentMethod && paymentMethod.userId !== userId) {
        throw new ForbiddenError("Método de pagamento não pertence ao usuário");
      }
    }

    const paymentAttributes: PaymentCreationAttributes = {
      orderId,
      userId,
      paymentMethodId: paymentMethod?.id,
      amount: order.totalAmount,
      type: paymentData.type,
      status: PaymentStatus.SUCCESS,
      installments,
      ...paymentDetails,
      paidAt: new Date(),
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
      authorizationCode: `AUTH${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      gatewayResponse: "Pagamento simulado - sempre sucesso",
    };

    const payment = await this.paymentRepository.create(paymentAttributes);

    await this.orderRepository.updatePaymentStatus(
      orderId,
      PaymentStatus.SUCCESS,
    );

    if (order.status === OrderStatus.PENDING) {
      await this.orderRepository.update(orderId, {
        status: OrderStatus.CONFIRMED,
      });
    }

    return {
      payment,
      order: await this.orderRepository.findById(orderId),
    };
  }

  private async processCardPayment(paymentData: any): Promise<any> {
    let cardLastFour = "";
    let cardBrand = "";

    if (paymentData.paymentMethodId) {
      const paymentMethod = await this.paymentMethodRepository.findById(
        paymentData.paymentMethodId,
      );
      if (paymentMethod) {
        cardLastFour = paymentMethod.cardLastFour || "";
        cardBrand = paymentMethod.cardBrand || "";
      }
    } else if (paymentData.cardData) {
      if (!paymentData.cardData.cardHolderName) {
        throw new ValidationError("Nome do titular do cartão é obrigatório");
      }

      if (!paymentData.cardData.cardNumber) {
        throw new ValidationError("Número do cartão é obrigatório");
      }

      cardLastFour = paymentData.cardData.cardNumber.slice(-4);
      cardBrand = this.getCardBrand(paymentData.cardData.cardNumber);
    }

    return {
      cardLastFour,
      cardBrand,
    };
  }

  private getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, "");

    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "Amex";

    return "Outro";
  }

  private async processPixPayment(amount: number): Promise<any> {
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${this.generateGuid()}52040000530398654${Math.round(
      amount * 100,
    )
      .toString()
      .padStart(13, "0")}5802BR5913ECOMMERCE6009SAO PAULO62070503***6304`;
    const pixExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    return {
      pixCode,
      pixExpiration,
    };
  }

  private async processBoletoPayment(amount: number): Promise<any> {
    const boletoNumber = `3419.7.${Date.now().toString().slice(-8)} ${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`;
    const boletoDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias

    const linhaDigitavel = `34191.11111 11111.111111 11111.111111 1 111100000${Math.round(
      amount * 100,
    )
      .toString()
      .padStart(10, "0")}`;

    return {
      boletoNumber,
      boletoDueDate,
      boletoLinhaDigitavel: linhaDigitavel,
    };
  }

  private generateGuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  async getPaymentById(id: number, userId: number, currentUserRole: UserRole) {
    const payment = await this.paymentRepository.findById(id, {
      include: [
        {
          association: "order",
          include: [{ association: "user" }],
        },
        { association: "paymentMethod" },
      ],
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
      include: [{ association: "order" }, { association: "paymentMethod" }],
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

    const where = currentUserRole === UserRole.CUSTOMER ? { userId } : {};

    return await this.paymentRepository.findByUserId(userId, {
      where,
      include: [{ association: "order" }, { association: "paymentMethod" }],
      order: [["createdAt", "DESC"]],
    });
  }

  async refundPayment(
    paymentId: number,
    currentUserRole: UserRole,
    reason?: string,
  ) {
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
      refundedAt: new Date(),
      gatewayResponse: reason
        ? `Estornado: ${reason}`
        : "Estornado pelo administrador",
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao estornar pagamento", 500);
    }

    await this.orderRepository.updatePaymentStatus(
      payment.orderId,
      PaymentStatus.REFUNDED,
    );

    return await this.paymentRepository.findById(paymentId, {
      include: [{ association: "order" }, { association: "paymentMethod" }],
    });
  }

  async cancelPayment(
    paymentId: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const payment = await this.paymentRepository.findById(paymentId, {
      include: [{ association: "order" }],
    });

    if (!payment) {
      throw new NotFoundError("Pagamento não encontrado");
    }

    if (payment.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ValidationError(
        "Apenas pagamentos pendentes podem ser cancelados",
      );
    }

    const affectedCount = await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.CANCELLED,
      cancelledAt: new Date(),
      gatewayResponse: "Cancelado pelo usuário",
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao cancelar pagamento", 500);
    }

    await this.orderRepository.updatePaymentStatus(
      payment.orderId,
      PaymentStatus.CANCELLED,
    );

    return await this.paymentRepository.findById(paymentId, {
      include: [{ association: "order" }, { association: "paymentMethod" }],
    });
  }
}
