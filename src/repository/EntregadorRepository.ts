import {
  Entregador,
  EntregadorCreationAttributes,
} from "../models/EntregadorModel";

export class EntregadorRepository {
  async createEntregador(data: EntregadorCreationAttributes) {
    return await Entregador.create(data);
  }

  async getAllEntregadores() {
    return await Entregador.findAll();
  }

  async getEntregadorById(id_entregador: number) {
    return await Entregador.findByPk(id_entregador);
  }

  async updateEntregador(id_entregador: number, data: Partial<Entregador>) {
    const entregador = await Entregador.findByPk(id_entregador);
    if (!entregador) return null;
    return await entregador.update(data);
  }

  async deleteEntregador(id_entregador: number) {
    const entregador = await Entregador.findByPk(id_entregador);
    if (!entregador) return null;
    await entregador.destroy();
    return entregador;
  }
}
