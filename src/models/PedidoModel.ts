import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PedidoAttributes {
  id_pedido: number;
  id_cliente: number;
  id_endereco_entrega: number;
  data_pedido: Date | null;
  status:
    | "aguardando_pagamento"
    | "pago"
    | "em_preparacao"
    | "em_transporte"
    | "entregue"
    | "cancelado";
  total: number;
}

export interface PedidoCreationAttributes
  extends Optional<PedidoAttributes, "id_pedido" | "data_pedido"> {}

export class Pedido
  extends Model<PedidoAttributes, PedidoCreationAttributes>
  implements PedidoAttributes
{
  public id_pedido!: number;
  public id_cliente!: number;
  public id_endereco_entrega!: number;
  public data_pedido!: Date | null;
  public status!:
    | "aguardando_pagamento"
    | "pago"
    | "em_preparacao"
    | "em_transporte"
    | "entregue"
    | "cancelado";
  public total!: number;
}

Pedido.init(
  {
    id_pedido: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_endereco_entrega: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data_pedido: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "aguardando_pagamento",
        "pago",
        "em_preparacao",
        "em_transporte",
        "entregue",
        "cancelado"
      ),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "pedidos",
    timestamps: false,
  }
);
