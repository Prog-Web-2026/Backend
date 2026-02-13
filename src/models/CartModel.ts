import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";
import { Product } from "./ProductModel";

export interface CartAttributes {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartCreationAttributes extends Optional<
  CartAttributes,
  "id" | "createdAt" | "updatedAt"
> {}

export class Cart
  extends Model<CartAttributes, CartCreationAttributes>
  implements CartAttributes
{
  public id!: number;
  public userId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly product?: Product;
  public readonly user?: User;
}

Cart.init(
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    tableName: "cart_items",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"],
      },
    ],
  },
);

Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
Cart.belongsTo(Product, { foreignKey: "productId", as: "product" });
User.hasMany(Cart, { foreignKey: "userId", as: "cartItems" });
Product.hasMany(Cart, { foreignKey: "productId", as: "inCarts" });
