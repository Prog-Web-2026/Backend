import dotenv from "dotenv";
dotenv.config();

// Importa todos os models com associações na ordem correta
import "./models/Associations";

import sequelize from "./config/database";
import { app } from "./app";
import { seedAdmin } from "./config/configAdmin";

const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Banco de dados conectado!");
    seedAdmin();
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });
