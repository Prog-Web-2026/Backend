import { ClienteRepository } from "../repository/ClienteRepository";
import {
  ClienteCreationAttributes,
  ClienteAttributes,
} from "../models/ClienteModel";

const clienteRepo = new ClienteRepository();

export class ClienteService {
  async create(data: ClienteCreationAttributes) {
    return await clienteRepo.createCliente(data);
  }

  async getAll() {
    return await clienteRepo.getAllClientes();
  }

  async getById(id_cliente: number) {
    return await clienteRepo.getClienteById(id_cliente);
  }

  async update(id_cliente: number, data: Partial<ClienteAttributes>) {
    return await clienteRepo.updateCliente(id_cliente, data);
  }

  async delete(id_cliente: number) {
    return await clienteRepo.deleteCliente(id_cliente);
  }
}
