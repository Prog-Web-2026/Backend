import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";
import { Order } from "./OrderModel";
import { PaymentMethod } from "./PaymentMethodModel";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum PaymentType {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PIX = "pix",
  BOLETO = "boleto",
}

export interface PaymentAttributes {
  id: number;
  orderId: number;
  userId: number;
  paymentMethodId?: number;

  amount: number;
  type: PaymentType;
  status: PaymentStatus;

  installments?: number;

  pixCode?: string;
  pixQrCode?: string;
  pixExpiration?: Date;

  boletoNumber?: string;
  boletoDueDate?: Date;
  boletoBarcode?: string;
  boletoLinhaDigitavel?: string;

  cardLastFour?: string;
  cardBrand?: string;

  transactionId?: string;
  authorizationCode?: string;
  gatewayResponse?: string;

  paidAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;

  metadata?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<
  PaymentAttributes,
  "id" | "status" | "createdAt" | "updatedAt"
> {}

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public orderId!: number;
  public userId!: number;
  public paymentMethodId?: number;

  public amount!: number;
  public type!: PaymentType;
  public status!: PaymentStatus;

  public installments?: number;

  public pixCode?: string;
  public pixQrCode?: string;
  public pixExpiration?: Date;

  public boletoNumber?: string;
  public boletoDueDate?: Date;
  public boletoBarcode?: string;
  public boletoLinhaDigitavel?: string;

  public cardLastFour?: string;
  public cardBrand?: string;

  public transactionId?: string;
  public authorizationCode?: string;
  public gatewayResponse?: string;

  public paidAt?: Date;
  public refundedAt?: Date;
  public cancelledAt?: Date;

  public metadata?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly order?: Order;
  public readonly user?: User;
  public readonly paymentMethod?: PaymentMethod;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    paymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "payment_methods",
        key: "id",
      },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(PaymentType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },

    installments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 12,
      },
    },

    // PIX
    pixCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pixQrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pixExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Boleto
    boletoNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    boletoDueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    boletoBarcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    boletoLinhaDigitavel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardLastFour: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    authorizationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gatewayResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: true,
    indexes: [
      {
        fields: ["orderId"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["transactionId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
    ],
  },
);

export const associatePayment = () => {
  const { Order } = require("./OrderModel");
  Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
  Payment.belongsTo(User, { foreignKey: "userId", as: "user" });
  Payment.belongsTo(PaymentMethod, {
    foreignKey: "paymentMethodId",
    as: "paymentMethod",
  });
};
