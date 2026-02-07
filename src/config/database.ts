import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const sequelize = isTest
  ? new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME as string,
      process.env.DB_USER as string,
      process.env.DB_PASSWORD as string,
      {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: "postgres",
        logging: false,
      },
    );

export default sequelize;
