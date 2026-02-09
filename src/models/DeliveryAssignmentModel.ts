import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";
import { Order } from "./OrderModel";

export enum AssignmentStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface DeliveryAssignmentAttributes {
  id: number;
  orderId: number;
  deliveryId: number;
  status: AssignmentStatus;
  distance: number;
  estimatedTime: number;
  assignedAt: Date;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryAssignmentCreationAttributes extends Optional<
  DeliveryAssignmentAttributes,
  "id" | "status" | "assignedAt" | "createdAt" | "updatedAt"
> {}

export class DeliveryAssignment
  extends Model<
    DeliveryAssignmentAttributes,
    DeliveryAssignmentCreationAttributes
  >
  implements DeliveryAssignmentAttributes
{
  public id!: number;
  public orderId!: number;
  public deliveryId!: number;
  public status!: AssignmentStatus;
  public distance!: number;
  public estimatedTime!: number;
  public assignedAt!: Date;
  public respondedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly order?: Order;
  public readonly deliveryPerson?: User;
}

DeliveryAssignment.init(
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
    deliveryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AssignmentStatus)),
      allowNull: false,
      defaultValue: AssignmentStatus.PENDING,
    },
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: "Distance in kilometers",
      validate: {
        min: 0,
      },
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Estimated time in minutes",
      validate: {
        min: 1,
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "delivery_assignments",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["orderId", "deliveryId"],
      },
    ],
  },
);

DeliveryAssignment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
DeliveryAssignment.belongsTo(User, {
  foreignKey: "deliveryId",
  as: "deliveryPerson",
  constraints: false,
});
Order.hasMany(DeliveryAssignment, { foreignKey: "orderId", as: "assignments" });
User.hasMany(DeliveryAssignment, {
  foreignKey: "deliveryId",
  as: "deliveryAssignments",
});
