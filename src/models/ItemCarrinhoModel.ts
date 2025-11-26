import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface ItemCarrinhoAttributes {
  id_carrinho: number;
  id_produto: number;
  quantidade: number;
  preco_unitario: number;
}

export class ItemCarrinho
  extends Model<ItemCarrinhoAttributes>
  implements ItemCarrinhoAttributes
{
  public id_carrinho!: number;
  public id_produto!: number;
  public quantidade!: number;
  public preco_unitario!: number;
}

ItemCarrinho.init(
  {
    id_carrinho: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    id_produto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "itens_carrinho",
    timestamps: false,
  }
);
