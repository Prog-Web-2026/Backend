import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface ItemPedidoAttributes {
  id_pedido: number;
  id_produto: number;
  quantidade: number;
  preco_unitario: number;
}

export class ItemPedido
  extends Model<ItemPedidoAttributes>
  implements ItemPedidoAttributes
{
  public id_pedido!: number;
  public id_produto!: number;
  public quantidade!: number;
  public preco_unitario!: number;
}

ItemPedido.init(
  {
    id_pedido: {
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
    tableName: "itens_pedido",
    timestamps: false,
  }
);
