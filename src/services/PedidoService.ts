import { PedidoRepository } from "../repository/PedidoRepository";
import {
  PedidoCreationAttributes,
  PedidoAttributes,
} from "../models/PedidoModel";

const pedidoRepo = new PedidoRepository();

export class PedidoService {
  async create(data: PedidoCreationAttributes) {
    return await pedidoRepo.createPedido(data);
  }

  async getAll() {
    return await pedidoRepo.getAllPedidos();
  }

  async getById(id_pedido: number) {
    return await pedidoRepo.getPedidoById(id_pedido);
  }

  async update(id_pedido: number, data: Partial<PedidoAttributes>) {
    return await pedidoRepo.updatePedido(id_pedido, data);
  }

  async delete(id_pedido: number) {
    return await pedidoRepo.deletePedido(id_pedido);
  }
}
