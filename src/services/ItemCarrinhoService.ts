import { ItemCarrinhoRepository } from "../repository/ItemCarrinhoRepository";
import { ItemCarrinhoAttributes } from "../models/ItemCarrinhoModel";

const itemRepo = new ItemCarrinhoRepository();

export class ItemCarrinhoService {
  async create(data: ItemCarrinhoAttributes) {
    return await itemRepo.createItem(data);
  }

  async getAll() {
    return await itemRepo.getAllItems();
  }

  async getById(id_carrinho: number, id_produto: number) {
    return await itemRepo.getItemById(id_carrinho, id_produto);
  }

  async update(
    id_carrinho: number,
    id_produto: number,
    data: Partial<ItemCarrinhoAttributes>
  ) {
    return await itemRepo.updateItem(id_carrinho, id_produto, data);
  }

  async delete(id_carrinho: number, id_produto: number) {
    return await itemRepo.deleteItem(id_carrinho, id_produto);
  }
}
