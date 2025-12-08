import { EntregadorRepository } from "../repository/EntregadorRepository";
import {
  EntregadorCreationAttributes,
  EntregadorAttributes,
} from "../models/EntregadorModel";

const entregadorRepo = new EntregadorRepository();

export class EntregadorService {
  async create(data: EntregadorCreationAttributes) {
    return await entregadorRepo.createEntregador(data);
  }

  async getAll() {
    return await entregadorRepo.getAllEntregadores();
  }

  async getById(id_entregador: number) {
    return await entregadorRepo.getEntregadorById(id_entregador);
  }

  async update(id_entregador: number, data: Partial<EntregadorAttributes>) {
    return await entregadorRepo.updateEntregador(id_entregador, data);
  }

  async delete(id_entregador: number) {
    return await entregadorRepo.deleteEntregador(id_entregador);
  }
}
