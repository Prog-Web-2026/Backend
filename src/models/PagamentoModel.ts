import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PagamentoAttributes {
  id_pagamento: number;
  id_pedido: number;
  metodo_pagamento: "pix" | "boleto" | "cartao";
  id_cartao: number | null;
  valor: number;
  status: "pendente" | "confirmado" | "falhou" | "estornado";
  data_pagamento: Date | null;
  chave_pix: string | null;
  codigo_boleto: string | null;
}

export interface PagamentoCreationAttributes
  extends Optional<
    PagamentoAttributes,
    | "id_pagamento"
    | "id_cartao"
    | "data_pagamento"
    | "chave_pix"
    | "codigo_boleto"
  > {}

export class Pagamento
  extends Model<PagamentoAttributes, PagamentoCreationAttributes>
  implements PagamentoAttributes
{
  public id_pagamento!: number;
  public id_pedido!: number;
  public metodo_pagamento!: "pix" | "boleto" | "cartao";
  public id_cartao!: number | null;
  public valor!: number;
  public status!: "pendente" | "confirmado" | "falhou" | "estornado";
  public data_pagamento!: Date | null;
  public chave_pix!: string | null;
  public codigo_boleto!: string | null;
}

Pagamento.init(
  {
    id_pagamento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    metodo_pagamento: {
      type: DataTypes.ENUM("pix", "boleto", "cartao"),
      allowNull: false,
    },
    id_cartao: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pendente", "confirmado", "falhou", "estornado"),
      allowNull: false,
    },
    data_pagamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    chave_pix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codigo_boleto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pagamentos",
    timestamps: false,
  }
);
