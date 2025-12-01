import { Entrega, EntregaCreationAttributes } from "../models/EntregaModel";

export class EntregaRepository {
  async createEntrega(data: EntregaCreationAttributes) {
    return await Entrega.create(data);
  }

  async getAllEntregas() {
    return await Entrega.findAll();
  }

  async getEntregaById(id_entrega: number) {
    return await Entrega.findByPk(id_entrega);
  }

  async updateEntrega(id_entrega: number, data: Partial<Entrega>) {
    const entrega = await Entrega.findByPk(id_entrega);
    if (!entrega) return null;
    return await entrega.update(data);
  }

  async deleteEntrega(id_entrega: number) {
    const entrega = await Entrega.findByPk(id_entrega);
    if (!entrega) return null;
    await entrega.destroy();
    return entrega;
  }
}
