import dotenv from "dotenv";
import sequelize from "./config/database";
import { app } from "./app";

import { associatePayment } from "./models/PaymentModel";
import { associateOrder } from "./models/OrderModel";

dotenv.config();

associatePayment();
associateOrder();

const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Banco de dados conectado!");
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });
