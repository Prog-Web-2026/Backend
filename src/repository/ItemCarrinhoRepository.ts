import {
  ItemCarrinho,
  ItemCarrinhoAttributes,
} from "../models/ItemCarrinhoModel";

export class ItemCarrinhoRepository {
  async createItem(data: ItemCarrinhoAttributes) {
    return await ItemCarrinho.create(data);
  }

  async getAllItems() {
    return await ItemCarrinho.findAll();
  }

  async getItemById(id_carrinho: number, id_produto: number) {
    return await ItemCarrinho.findOne({
      where: { id_carrinho, id_produto },
    });
  }

  async updateItem(
    id_carrinho: number,
    id_produto: number,
    data: Partial<ItemCarrinho>
  ) {
    const item = await this.getItemById(id_carrinho, id_produto);
    if (!item) return null;
    return await item.update(data);
  }

  async deleteItem(id_carrinho: number, id_produto: number) {
    const item = await this.getItemById(id_carrinho, id_produto);
    if (!item) return null;
    await item.destroy();
    return item;
  }
}
