import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ProdutoAttributes {
  id_produto: number;
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number;
  categoria: string | null;
  imagem_url: string | null;
}

export interface ProdutoCreationAttributes
  extends Optional<
    ProdutoAttributes,
    "id_produto" | "descricao" | "categoria" | "imagem_url"
  > {}

export class Produto
  extends Model<ProdutoAttributes, ProdutoCreationAttributes>
  implements ProdutoAttributes
{
  public id_produto!: number;
  public nome!: string;
  public descricao!: string | null;
  public preco!: number;
  public estoque!: number;
  public categoria!: string | null;
  public imagem_url!: string | null;
}

Produto.init(
  {
    id_produto: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estoque: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imagem_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "produtos",
    timestamps: false,
  }
);
