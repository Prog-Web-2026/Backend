import { Carrinho, CarrinhoCreationAttributes } from "../models/CarrinhoModel";

export class CarrinhoRepository {
  async createCarrinho(data: CarrinhoCreationAttributes) {
    return await Carrinho.create(data);
  }

  async getAllCarrinhos() {
    return await Carrinho.findAll();
  }

  async getCarrinhoById(id_carrinho: number) {
    return await Carrinho.findByPk(id_carrinho);
  }

  async updateCarrinho(id_carrinho: number, data: Partial<Carrinho>) {
    const carrinho = await Carrinho.findByPk(id_carrinho);
    if (!carrinho) return null;
    return await carrinho.update(data);
  }

  async deleteCarrinho(id_carrinho: number) {
    const carrinho = await Carrinho.findByPk(id_carrinho);
    if (!carrinho) return null;
    await carrinho.destroy();
    return carrinho;
  }
}
