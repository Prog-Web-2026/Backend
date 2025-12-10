import { ItemPedidoRepository } from "../repository/ItemPedidoRepository";
import { ItemPedidoAttributes } from "../models/ItemPedidoModel";

const itemRepo = new ItemPedidoRepository();

export class ItemPedidoService {
  async create(data: ItemPedidoAttributes) {
    return await itemRepo.createItem(data);
  }

  async getAll() {
    return await itemRepo.getAllItems();
  }

  async getById(id_pedido: number, id_produto: number) {
    return await itemRepo.getItemById(id_pedido, id_produto);
  }

  async update(
    id_pedido: number,
    id_produto: number,
    data: Partial<ItemPedidoAttributes>
  ) {
    return await itemRepo.updateItem(id_pedido, id_produto, data);
  }

  async delete(id_pedido: number, id_produto: number) {
    return await itemRepo.deleteItem(id_pedido, id_produto);
  }
}
