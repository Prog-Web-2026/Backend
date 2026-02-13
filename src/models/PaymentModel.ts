import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { Order } from "./OrderModel";
import { User } from "./UserModel";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentType {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PIX = "pix",
}

export interface PaymentAttributes {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
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
  public amount!: number;
  public type!: PaymentType;
  public status!: PaymentStatus;
  public transactionId?: string;
  public paidAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly order?: Order;
  public readonly user?: User;
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
      unique: true,
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
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: true,
    indexes: [
      { fields: ["orderId"] },
      { fields: ["userId"] },
      { fields: ["status"] },
    ],
  },
);

Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });
Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });
User.hasMany(Payment, { foreignKey: "userId", as: "payments" });
