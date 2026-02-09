import { PaymentMethodRepository } from "../repository/PaymentMethodRepository";
import {
  PaymentMethod,
  PaymentMethodAttributes,
  PaymentMethodCreationAttributes,
  PaymentMethodType,
  CardBrand,
} from "../models/PaymentMethodModel";
import { UserRole } from "../models/UserModel";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../config/ErrorHandler";

export class PaymentMethodService {
  private paymentMethodRepository = new PaymentMethodRepository();

  async addCreditCard(
    userId: number,
    cardData: {
      cardHolderName: string;
      cardNumber: string;
      cardExpiryMonth: number;
      cardExpiryYear: number;
      cardCvv: string;
      isDefault?: boolean;
    },
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError("Apenas clientes podem adicionar cartões");
    }

    // Validações básicas
    if (!cardData.cardHolderName) {
      throw new ValidationError("Nome do titular é obrigatório");
    }

    if (!cardData.cardNumber || cardData.cardNumber.length < 13) {
      throw new ValidationError("Número do cartão inválido");
    }

    const currentYear = new Date().getFullYear();
    if (cardData.cardExpiryYear < currentYear) {
      throw new ValidationError("Cartão expirado");
    }

    const cardLastFour = cardData.cardNumber.slice(-4);
    const cardBrand = this.getCardBrand(cardData.cardNumber);

    const paymentMethodData: PaymentMethodCreationAttributes = {
      userId,
      type: PaymentMethodType.CREDIT_CARD,
      isDefault: cardData.isDefault || false,
      cardHolderName: cardData.cardHolderName,
      cardLastFour,
      cardBrand,
      cardExpiryMonth: cardData.cardExpiryMonth,
      cardExpiryYear: cardData.cardExpiryYear,
      // NÃO salvar: cardNumber completo, cardCvv
    };

    const paymentMethod =
      await this.paymentMethodRepository.create(paymentMethodData);

    if (paymentMethod.isDefault) {
      await this.setAsDefault(userId, paymentMethod.id, currentUserRole);
    }

    return paymentMethod;
  }

  async addDebitCard(
    userId: number,
    cardData: {
      cardHolderName: string;
      cardNumber: string;
      cardExpiryMonth: number;
      cardExpiryYear: number;
      cardCvv: string;
      isDefault?: boolean;
    },
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError("Apenas clientes podem adicionar cartões");
    }

    // Validações básicas
    if (!cardData.cardHolderName) {
      throw new ValidationError("Nome do titular é obrigatório");
    }

    if (!cardData.cardNumber || cardData.cardNumber.length < 13) {
      throw new ValidationError("Número do cartão inválido");
    }

    const currentYear = new Date().getFullYear();
    if (cardData.cardExpiryYear < currentYear) {
      throw new ValidationError("Cartão expirado");
    }

    const cardLastFour = cardData.cardNumber.slice(-4);
    const cardBrand = this.getCardBrand(cardData.cardNumber);

    const paymentMethodData: PaymentMethodCreationAttributes = {
      userId,
      type: PaymentMethodType.DEBIT_CARD,
      isDefault: cardData.isDefault || false,
      cardHolderName: cardData.cardHolderName,
      cardLastFour,
      cardBrand,
      cardExpiryMonth: cardData.cardExpiryMonth,
      cardExpiryYear: cardData.cardExpiryYear,
    };

    const paymentMethod =
      await this.paymentMethodRepository.create(paymentMethodData);

    if (paymentMethod.isDefault) {
      await this.setAsDefault(userId, paymentMethod.id, currentUserRole);
    }

    return paymentMethod;
  }

  private getCardBrand(cardNumber: string): CardBrand {
    const cleaned = cardNumber.replace(/\D/g, "");

    if (/^4/.test(cleaned)) {
      return CardBrand.VISA;
    } else if (/^5[1-5]/.test(cleaned)) {
      return CardBrand.MASTERCARD;
    } else if (/^3[47]/.test(cleaned)) {
      return CardBrand.AMEX;
    } else {
      return CardBrand.OTHER;
    }
  }

  async getUserPaymentMethods(userId: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError(
        "Apenas clientes podem ver métodos de pagamento",
      );
    }

    return await this.paymentMethodRepository.findByUserId(userId);
  }

  async getPaymentMethodById(
    id: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const paymentMethod = await this.paymentMethodRepository.findById(id);

    if (!paymentMethod) {
      throw new NotFoundError("Método de pagamento não encontrado");
    }

    if (paymentMethod.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    return paymentMethod;
  }

  async updatePaymentMethod(
    id: number,
    userId: number,
    updates: Partial<PaymentMethodAttributes>,
    currentUserRole: UserRole,
  ) {
    const paymentMethod = await this.paymentMethodRepository.findById(id);

    if (!paymentMethod) {
      throw new NotFoundError("Método de pagamento não encontrado");
    }

    if (paymentMethod.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    const affectedCount = await this.paymentMethodRepository.update(
      id,
      updates,
    );

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar método de pagamento", 500);
    }

    return await this.paymentMethodRepository.findById(id);
  }

  async deletePaymentMethod(
    id: number,
    userId: number,
    currentUserRole: UserRole,
  ) {
    const paymentMethod = await this.paymentMethodRepository.findById(id);

    if (!paymentMethod) {
      throw new NotFoundError("Método de pagamento não encontrado");
    }

    if (paymentMethod.userId !== userId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError("Acesso negado");
    }

    if (paymentMethod.isDefault) {
      throw new ValidationError(
        "Não é possível excluir o método de pagamento padrão",
      );
    }

    const deletedCount = await this.paymentMethodRepository.delete(id);

    if (deletedCount === 0) {
      throw new AppError("Erro ao excluir método de pagamento", 500);
    }

    return true;
  }

  async setAsDefault(
    userId: number,
    paymentMethodId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError(
        "Apenas clientes podem definir método de pagamento padrão",
      );
    }

    const paymentMethod =
      await this.paymentMethodRepository.findById(paymentMethodId);

    if (!paymentMethod) {
      throw new NotFoundError("Método de pagamento não encontrado");
    }

    if (paymentMethod.userId !== userId) {
      throw new ForbiddenError("Acesso negado");
    }

    await this.paymentMethodRepository.setAsDefault(userId, paymentMethodId);

    return await this.paymentMethodRepository.findById(paymentMethodId);
  }

  async getUserDefaultPaymentMethod(userId: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.CUSTOMER) {
      throw new ForbiddenError(
        "Apenas clientes podem ver métodos de pagamento",
      );
    }

    const paymentMethod =
      await this.paymentMethodRepository.findUserDefaultPaymentMethod(userId);

    if (!paymentMethod) {
      throw new NotFoundError("Nenhum método de pagamento padrão encontrado");
    }

    return paymentMethod;
  }
}
