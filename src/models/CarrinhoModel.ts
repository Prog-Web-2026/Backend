import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface CarrinhoAttributes {
  id_carrinho: number;
  id_cliente: number;
}

export interface CarrinhoCreationAttributes
  extends Optional<CarrinhoAttributes, "id_carrinho"> {}

export class Carrinho
  extends Model<CarrinhoAttributes, CarrinhoCreationAttributes>
  implements CarrinhoAttributes
{
  public id_carrinho!: number;
  public id_cliente!: number;
}

Carrinho.init(
  {
    id_carrinho: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "carrinhos",
    timestamps: false,
  }
);
