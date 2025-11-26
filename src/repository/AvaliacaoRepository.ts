import {
  Avaliacao,
  AvaliacaoCreationAttributes,
} from "../models/AvaliacaoModel";

export class AvaliacaoRepository {
  async createAvaliacao(data: AvaliacaoCreationAttributes) {
    return await Avaliacao.create(data);
  }

  async getAllAvaliacoes() {
    return await Avaliacao.findAll();
  }

  async getAvaliacaoById(id_avaliacao: number) {
    return await Avaliacao.findByPk(id_avaliacao);
  }

  async updateAvaliacao(id_avaliacao: number, data: Partial<Avaliacao>) {
    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) return null;
    return await avaliacao.update(data);
  }

  async deleteAvaliacao(id_avaliacao: number) {
    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) return null;
    await avaliacao.destroy();
    return avaliacao;
  }
}
