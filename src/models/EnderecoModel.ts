import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface EnderecoAttributes {
  id_endereco: number;
  id_cliente: number;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface EnderecoCreationAttributes
  extends Optional<EnderecoAttributes, "id_endereco" | "complemento"> {}

export class Endereco
  extends Model<EnderecoAttributes, EnderecoCreationAttributes>
  implements EnderecoAttributes
{
  public id_endereco!: number;
  public id_cliente!: number;
  public logradouro!: string;
  public numero!: string;
  public complemento!: string | null;
  public bairro!: string;
  public cidade!: string;
  public estado!: string;
  public cep!: string;
}

Endereco.init(
  {
    id_endereco: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    logradouro: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    complemento: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bairro: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cidade: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cep: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "enderecos",
    timestamps: false,
  }
);
