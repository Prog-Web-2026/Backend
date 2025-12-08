import { CarrinhoRepository } from "../repository/CarrinhoRepository";
import {
  CarrinhoCreationAttributes,
  CarrinhoAttributes,
} from "../models/CarrinhoModel";

const carrinhoRepo = new CarrinhoRepository();

export class CarrinhoService {
  async create(data: CarrinhoCreationAttributes) {
    return await carrinhoRepo.createCarrinho(data);
  }

  async getAll() {
    return await carrinhoRepo.getAllCarrinhos();
  }

  async getById(id_carrinho: number) {
    return await carrinhoRepo.getCarrinhoById(id_carrinho);
  }

  async update(id_carrinho: number, data: Partial<CarrinhoAttributes>) {
    return await carrinhoRepo.updateCarrinho(id_carrinho, data);
  }

  async delete(id_carrinho: number) {
    return await carrinhoRepo.deleteCarrinho(id_carrinho);
  }
}
