// src/app.ts
import express from "express";
import rateLimit from "express-rate-limit";

import userRoutes from "./routes/UserRoutes";
import enderecoRoutes from "./routes/EnderecoRoutes";
import produtoRoutes from "./routes/ProdutoRoutes";
import carrinhoRoutes from "./routes/CarrinnhoRoutes";
import itemCarrinhoRoutes from "./routes/ItemCarrinhoRoutes";
import pedidoRoutes from "./routes/PedidoRoutes";
import itemPedidoRoutes from "./routes/ItemPedidoRoutes";
import pagamentoRoutes from "./routes/PagamentRoutes";
import entregadorRoutes from "./routes/EntregadorRoutes";
import entregaRoutes from "./routes/EntregaRoutes";
import avaliacaoRoutes from "./routes/AvaliacaoRoutes";
import cartaoPagamentoRoutes from "./routes/CartaoPagamentoRoutes";

export const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições. Tente novamente em instantes.",
});

if (process.env.NODE_ENV !== "test") {
  app.use(limiter);
}

app.get("/", (_req, res) => {
  res.send("API rodando! Acesse suas rotas CRUD via endpoints. (v2)");
});

app.use("/users", userRoutes);
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
