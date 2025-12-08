import { EntregaRepository } from "../repository/EntregaRepository";
import {
  EntregaCreationAttributes,
  EntregaAttributes,
} from "../models/EntregaModel";

const entregaRepo = new EntregaRepository();

export class EntregaService {
  async create(data: EntregaCreationAttributes) {
    return await entregaRepo.createEntrega(data);
  }

  async getAll() {
    return await entregaRepo.getAllEntregas();
  }

  async getById(id_entrega: number) {
    return await entregaRepo.getEntregaById(id_entrega);
  }

  async update(id_entrega: number, data: Partial<EntregaAttributes>) {
    return await entregaRepo.updateEntrega(id_entrega, data);
  }

  async delete(id_entrega: number) {
    return await entregaRepo.deleteEntrega(id_entrega);
  }
}
