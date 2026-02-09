import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";
import { OrderItem } from "./OrderItemModel";
import { Payment, PaymentStatus } from "./PaymentModel";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY_FOR_DELIVERY = "ready_for_delivery",
  ON_THE_WAY = "on_the_way",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface OrderAttributes {
  id: number;
  userId: number;
  deliveryId: number | null;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryLatitude: number;
  deliveryLongitude: number;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<
  OrderAttributes,
  "id" | "status" | "paymentStatus" | "deliveryId" | "createdAt" | "updatedAt"
> {}

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public userId!: number;
  public deliveryId!: number | null;
  public paymentStatus!: PaymentStatus;
  public totalAmount!: number;
  public status!: OrderStatus;
  public deliveryLatitude!: number;
  public deliveryLongitude!: number;
  public estimatedDeliveryTime?: Date;
  public deliveredAt?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly customer?: User;
  public readonly deliveryPerson?: User;

  public readonly items?: OrderItem[];

  public readonly payment?: Payment;
}

Order.init(
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
    deliveryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.PENDING,
    },
    deliveryLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    deliveryLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
  },
);

Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" });

export const associateOrder = () => {
  const { User } = require("./UserModel");
  Order.belongsTo(User, { foreignKey: "userId", as: "customer" });
  Order.belongsTo(User, {
    foreignKey: "deliveryId",
    as: "deliveryPerson",
    constraints: false,
  });
};
