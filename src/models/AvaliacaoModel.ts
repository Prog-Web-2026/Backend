import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface AvaliacaoAttributes {
  id_avaliacao: number;
  id_cliente: number;
  id_produto: number;
  nota: number;
  comentario: string | null;
  data_avaliacao: Date | null;
}

export interface AvaliacaoCreationAttributes
  extends Optional<
    AvaliacaoAttributes,
    "id_avaliacao" | "comentario" | "data_avaliacao"
  > {}

export class Avaliacao
  extends Model<AvaliacaoAttributes, AvaliacaoCreationAttributes>
  implements AvaliacaoAttributes
{
  public id_avaliacao!: number;
  public id_cliente!: number;
  public id_produto!: number;
  public nota!: number;
  public comentario!: string | null;
  public data_avaliacao!: Date | null;
}

Avaliacao.init(
  {
    id_avaliacao: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nota: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data_avaliacao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "avaliacoes",
    timestamps: false,
  }
);
