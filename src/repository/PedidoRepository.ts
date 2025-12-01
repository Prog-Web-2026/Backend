import { Pedido, PedidoCreationAttributes } from "../models/PedidoModel";

export class PedidoRepository {
  async createPedido(data: PedidoCreationAttributes) {
    return await Pedido.create(data);
  }

  async getAllPedidos() {
    return await Pedido.findAll();
  }

  async getPedidoById(id_pedido: number) {
    return await Pedido.findByPk(id_pedido);
  }

  async updatePedido(id_pedido: number, data: Partial<Pedido>) {
    const pedido = await Pedido.findByPk(id_pedido);
    if (!pedido) return null;
    return await pedido.update(data);
  }

  async deletePedido(id_pedido: number) {
    const pedido = await Pedido.findByPk(id_pedido);
    if (!pedido) return null;
    await pedido.destroy();
    return pedido;
  }
}
