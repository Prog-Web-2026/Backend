import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import rateLimit from "express-rate-limit";

// Importando rotas
import userRoutes from "./routes/UserRoutes";
import clienteRoutes from "./routes/ClienteRoutes";
import enderecoRoutes from "./routes/EnderecoRoutes";
import produtoRoutes from "./routes/ProdutoRoutes";
import carrinhoRoutes from "./routes/CarrinnhoRoutes";
import itemCarrinhoRoutes from "./routes/ItemCarrinhoRoutes";
import pedidoRoutes from "./routes/PedidoRoutes";
import itemPedidoRoutes from "./routes/ItemPedidoRoutes";
import pagamentoRoutes from "./routes/PagamentRoutes";
import entregadorRoutes from "./routes/EntregadorRoutes";
import entregaRoutes from "./routes/EntregaRouter";
import avaliacaoRoutes from "./routes/AvaliacaoRoutes";
import cartaoPagamentoRoutes from "./routes/CartaoPagamentoRoutes";

dotenv.config();

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições. Tente novamente em instantes."
});
app.use(limiter);

app.get("/", (_req, res) => {
  res.send("API rodando! Acesse suas rotas CRUD via endpoints. (v2)");
});

// ROTAS
app.use("/users", userRoutes);
app.use("/clientes", clienteRoutes);
app.use("/enderecos", enderecoRoutes);
app.use("/produtos", produtoRoutes);
app.use("/carrinhos", carrinhoRoutes);
app.use("/itens-carrinho", itemCarrinhoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itens-pedido", itemPedidoRoutes);
app.use("/pagamentos", pagamentoRoutes);
app.use("/entregadores", entregadorRoutes);
app.use("/entregas", entregaRoutes);
app.use("/avaliacoes", avaliacaoRoutes);
app.use("/cartoes-pagamento", cartaoPagamentoRoutes);

const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Banco de dados conectado!");
    app.listen(PORT, () =>
      console.log(`Servidor rodando na porta ${PORT}`)
    );
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });
