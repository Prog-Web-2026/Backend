import {
  CartaoPagamento,
  CartaoPagamentoCreationAttributes,
} from "../models/CartaoPagamentoModel";

export class CartaoPagamentoRepository {
  async createCartao(data: CartaoPagamentoCreationAttributes) {
    return await CartaoPagamento.create(data);
  }

  async getAllCartoes() {
    return await CartaoPagamento.findAll();
  }

  async getCartaoById(id_cartao: number) {
    return await CartaoPagamento.findByPk(id_cartao);
  }

  async updateCartao(id_cartao: number, data: Partial<CartaoPagamento>) {
    const cartao = await CartaoPagamento.findByPk(id_cartao);
    if (!cartao) return null;
    return await cartao.update(data);
  }

  async deleteCartao(id_cartao: number) {
    const cartao = await CartaoPagamento.findByPk(id_cartao);
    if (!cartao) return null;
    await cartao.destroy();
    return cartao;
  }
}
