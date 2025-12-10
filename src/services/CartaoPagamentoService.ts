import { CartaoPagamentoRepository } from "../repository/CartaoPagamentoRepository";
import {
  CartaoPagamentoCreationAttributes,
  CartaoPagamentoAttributes,
} from "../models/CartaoPagamentoModel";

const cartaoRepo = new CartaoPagamentoRepository();

export class CartaoPagamentoService {
  async create(data: CartaoPagamentoCreationAttributes) {
    return await cartaoRepo.createCartao(data);
  }

  async getAll() {
    return await cartaoRepo.getAllCartoes();
  }

  async getById(id_cartao: number) {
    return await cartaoRepo.getCartaoById(id_cartao);
  }

  async update(id_cartao: number, data: Partial<CartaoPagamentoAttributes>) {
    return await cartaoRepo.updateCartao(id_cartao, data);
  }

  async delete(id_cartao: number) {
    return await cartaoRepo.deleteCartao(id_cartao);
  }
}
