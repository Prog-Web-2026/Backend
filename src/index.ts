import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";

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
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });

app.get("/", (_req, res) => {
  res.send("API rodando! Acesse suas rotas CRUD via endpoints.");
});
