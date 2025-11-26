import { Cliente, ClienteCreationAttributes } from "../models/ClienteModel";

export class ClienteRepository {
  async createCliente(data: ClienteCreationAttributes) {
    return await Cliente.create(data);
  }

  async getAllClientes() {
    return await Cliente.findAll();
  }

  async getClienteById(id_cliente: number) {
    return await Cliente.findByPk(id_cliente);
  }

  async updateCliente(
    id_cliente: number,
    data: Partial<ClienteCreationAttributes>
  ) {
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) return null;
    return await cliente.update(data);
  }

  async deleteCliente(id_cliente: number) {
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) return null;
    await cliente.destroy();
    return cliente;
  }
}
