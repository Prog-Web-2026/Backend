import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// If required DB env vars are missing, fallback to a local sqlite file for
// development/testing convenience. This keeps changes minimal and safe.
const dialect = (process.env.DB_DIALECT || "").toLowerCase();
const useSqliteFallback =
  !process.env.DB_DIALECT ||
  !process.env.DB_HOST ||
  !process.env.DB_NAME ||
  dialect === "sqlite";

let sequelize: Sequelize;

if (useSqliteFallback) {
  const storagePath = process.env.SQLITE_STORAGE || path.resolve(__dirname, "../../dev.sqlite");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging: false,
  });
} else {
  sequelize = new Sequelize({
    dialect: process.env.DB_DIALECT! as "postgres" | "mysql",
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    username: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,
    logging: false,
  });
}

export default sequelize;
