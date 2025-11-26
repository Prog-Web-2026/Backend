import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ClienteAttributes {
  id_cliente: number;
  nome: string;
  email: string;
  senha_hash: string | null;
  telefone: string | null;
  data_criacao: Date | null;
  endereco_padrao_id: number | null;
}

export interface ClienteCreationAttributes
  extends Optional<
    ClienteAttributes,
    | "id_cliente"
    | "senha_hash"
    | "telefone"
    | "data_criacao"
    | "endereco_padrao_id"
  > {}

export class Cliente
  extends Model<ClienteAttributes, ClienteCreationAttributes>
  implements ClienteAttributes
{
  public id_cliente!: number;
  public nome!: string;
  public email!: string;
  public senha_hash!: string | null;
  public telefone!: string | null;
  public data_criacao!: Date | null;
  public endereco_padrao_id!: number | null;
}

Cliente.init(
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data_criacao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endereco_padrao_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "clientes",
    timestamps: false,
  }
);
