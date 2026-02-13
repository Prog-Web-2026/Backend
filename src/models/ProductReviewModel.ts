import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./UserModel";
import { Product } from "./ProductModel";

export interface ProductReviewAttributes {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductReviewCreationAttributes extends Optional<
  ProductReviewAttributes,
  "id" | "isActive" | "createdAt" | "updatedAt" | "comment" | "imageUrl"
> {}

export class ProductReview
  extends Model<ProductReviewAttributes, ProductReviewCreationAttributes>
  implements ProductReviewAttributes
{
  public id!: number;
  public userId!: number;
  public productId!: number;
  public rating!: number;
  public comment!: string | null;
  public imageUrl!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly user?: User;
  public readonly product?: Product;
}

ProductReview.init(
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
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
    tableName: "product_reviews",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"],
      },
    ],
  },
);

ProductReview.belongsTo(User, { foreignKey: "userId", as: "user" });
ProductReview.belongsTo(Product, { foreignKey: "productId", as: "product" });
User.hasMany(ProductReview, { foreignKey: "userId", as: "reviews" });
Product.hasMany(ProductReview, { foreignKey: "productId", as: "reviews" });
