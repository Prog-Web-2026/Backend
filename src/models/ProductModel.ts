import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import { Category } from "./CategoryModel";

export interface ProductAttributes {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl?: string;
  weight?: number;
  dimensions?: string;
  isActive: boolean;

  // ALTERADO: adicionados campos para avaliações
  averageRating: number;
  reviewCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<
  ProductAttributes,
  | "id"
  | "isActive"
  | "averageRating"
  | "reviewCount"
  | "createdAt"
  | "updatedAt"
> {}

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
  public price!: number;
  public stock!: number;
  public categoryId!: number;
  public imageUrl?: string;
  public weight?: number;
  public dimensions?: string;
  public isActive!: boolean;

  // ALTERADO: adicionados campos para avaliações
  public averageRating!: number;
  public reviewCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly category?: Category;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    dimensions: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
  },
);

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
