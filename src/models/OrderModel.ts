import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY_FOR_PICKUP = "ready_for_pickup",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface OrderAttributes {
  id: number;
  userId: number;
  deliveryId: number | null;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<
  OrderAttributes,
  "id" | "status" | "deliveryId" | "createdAt" | "updatedAt"
> {}

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public userId!: number;
  public deliveryId!: number | null;
  public totalAmount!: number;
  public status!: OrderStatus;
  public deliveryAddress!: string;
  public deliveryLatitude?: number;
  public deliveryLongitude?: number;
  public estimatedDeliveryTime?: Date;
  public deliveredAt?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly customer?: User;
  public readonly deliveryPerson?: User;
  public readonly items?: any[];
  public readonly payment?: any;
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
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deliveryLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    deliveryLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
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
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
  },
);

Order.belongsTo(User, { foreignKey: "userId", as: "customer" });
Order.belongsTo(User, { foreignKey: "deliveryId", as: "deliveryPerson" });
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
