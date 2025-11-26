import { ItemPedido, ItemPedidoAttributes } from "../models/ItemPedidoModel";

export class ItemPedidoRepository {
  async createItem(data: ItemPedidoAttributes) {
    return await ItemPedido.create(data);
  }

  async getAllItems() {
    return await ItemPedido.findAll();
  }

  async getItemById(id_pedido: number, id_produto: number) {
    return await ItemPedido.findOne({
      where: { id_pedido, id_produto },
    });
  }

  async updateItem(
    id_pedido: number,
    id_produto: number,
    data: Partial<ItemPedido>
  ) {
    const item = await this.getItemById(id_pedido, id_produto);
    if (!item) return null;
    return await item.update(data);
  }

  async deleteItem(id_pedido: number, id_produto: number) {
    const item = await this.getItemById(id_pedido, id_produto);
    if (!item) return null;
    await item.destroy();
    return item;
  }
}
