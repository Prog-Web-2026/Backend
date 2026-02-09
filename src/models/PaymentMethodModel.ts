import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";

export enum PaymentMethodType {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PIX = "pix",
  BOLETO = "boleto",
}

export enum CardBrand {
  VISA = "visa",
  MASTERCARD = "mastercard",
  ELO = "elo",
  AMEX = "amex",
  HIPERCARD = "hipercard",
  OTHER = "other",
}

export interface PaymentMethodAttributes {
  id: number;
  userId: number;
  type: PaymentMethodType;
  isDefault: boolean;

  cardHolderName?: string;
  cardNumber?: string;
  cardExpiryMonth?: number;
  cardExpiryYear?: number;
  cardCvv?: string;
  cardBrand?: CardBrand;
  cardLastFour?: string;

  pixKey?: string;
  pixKeyType?: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

  boletoNumber?: string;
  boletoDueDate?: Date;
  boletoBarcode?: string;

  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentMethodCreationAttributes extends Optional<
  PaymentMethodAttributes,
  "id" | "isDefault" | "isActive" | "createdAt" | "updatedAt"
> {}

export class PaymentMethod
  extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes>
  implements PaymentMethodAttributes
{
  public id!: number;
  public userId!: number;
  public type!: PaymentMethodType;
  public isDefault!: boolean;

  public cardHolderName?: string;
  public cardNumber?: string;
  public cardExpiryMonth?: number;
  public cardExpiryYear?: number;
  public cardCvv?: string;
  public cardBrand?: CardBrand;
  public cardLastFour?: string;

  public pixKey?: string;
  public pixKeyType?: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

  public boletoNumber?: string;
  public boletoDueDate?: Date;
  public boletoBarcode?: string;

  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly user?: User;
}

PaymentMethod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(PaymentMethodType)),
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cardHolderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardExpiryMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },
    cardExpiryYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: new Date().getFullYear(),
        max: new Date().getFullYear() + 20,
      },
    },
    cardCvv: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.ENUM(...Object.values(CardBrand)),
      allowNull: true,
    },
    cardLastFour: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    pixKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pixKeyType: {
      type: DataTypes.ENUM("CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"),
      allowNull: true,
    },
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

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "payment_methods",
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "isDefault"],
      },
      {
        fields: ["userId", "type"],
      },
    ],
  },
);

PaymentMethod.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(PaymentMethod, { foreignKey: "userId", as: "paymentMethods" });
