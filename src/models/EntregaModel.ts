import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface EntregaAttributes {
  id_entrega: number;
  id_pedido: number;
  id_entregador: number;
  codigo_rastreio: string | null;
  status:
    | "aguardando_retirada"
    | "em_transporte"
    | "entregue"
    | "falha_entrega";
  data_retirada: Date | null;
  data_entrega: Date | null;
}

export interface EntregaCreationAttributes
  extends Optional<
    EntregaAttributes,
    "id_entrega" | "codigo_rastreio" | "data_retirada" | "data_entrega"
  > {}

export class Entrega
  extends Model<EntregaAttributes, EntregaCreationAttributes>
  implements EntregaAttributes
{
  public id_entrega!: number;
  public id_pedido!: number;
  public id_entregador!: number;
  public codigo_rastreio!: string | null;
  public status!:
    | "aguardando_retirada"
    | "em_transporte"
    | "entregue"
    | "falha_entrega";
  public data_retirada!: Date | null;
  public data_entrega!: Date | null;
}

Entrega.init(
  {
    id_entrega: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_entregador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigo_rastreio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "aguardando_retirada",
        "em_transporte",
        "entregue",
        "falha_entrega"
      ),
      allowNull: false,
    },
    data_retirada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "entregas",
    timestamps: false,
  }
);
