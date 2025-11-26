import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface CartaoPagamentoAttributes {
  id_cartao: number;
  id_cliente: number;
  bandeira: string;
  numero_mascarado: string;
  nome_titular: string;
  validade: Date;
  cvv_hash: string;
}

export interface CartaoPagamentoCreationAttributes
  extends Optional<CartaoPagamentoAttributes, "id_cartao"> {}

export class CartaoPagamento
  extends Model<CartaoPagamentoAttributes, CartaoPagamentoCreationAttributes>
  implements CartaoPagamentoAttributes
{
  public id_cartao!: number;
  public id_cliente!: number;
  public bandeira!: string;
  public numero_mascarado!: string;
  public nome_titular!: string;
  public validade!: Date;
  public cvv_hash!: string;
}

CartaoPagamento.init(
  {
    id_cartao: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bandeira: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numero_mascarado: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nome_titular: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    validade: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cvv_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "cartoes_pagamento",
    timestamps: false,
  }
);
