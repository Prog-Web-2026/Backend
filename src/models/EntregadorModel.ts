import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface EntregadorAttributes {
  id_entregador: number;
  nome: string;
  cpf: string;
  telefone: string;
  placa_veiculo: string;
  tipo_veiculo: "moto" | "carro" | "outro";
  status: "disponivel" | "em_entrega" | "inativo";
}

export interface EntregadorCreationAttributes
  extends Optional<EntregadorAttributes, "id_entregador"> {}

export class Entregador
  extends Model<EntregadorAttributes, EntregadorCreationAttributes>
  implements EntregadorAttributes
{
  public id_entregador!: number;
  public nome!: string;
  public cpf!: string;
  public telefone!: string;
  public placa_veiculo!: string;
  public tipo_veiculo!: "moto" | "carro" | "outro";
  public status!: "disponivel" | "em_entrega" | "inativo";
}

Entregador.init(
  {
    id_entregador: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placa_veiculo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo_veiculo: {
      type: DataTypes.ENUM("moto", "carro", "outro"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("disponivel", "em_entrega", "inativo"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "entregadores",
    timestamps: false,
  }
);
