import { AvaliacaoRepository } from "../repository/AvaliacaoRepository";
import {
  AvaliacaoCreationAttributes,
  AvaliacaoAttributes,
} from "../models/AvaliacaoModel";

const avaliacaoRepo = new AvaliacaoRepository();

export class AvaliacaoService {
  async create(data: AvaliacaoCreationAttributes) {
    return await avaliacaoRepo.createAvaliacao(data);
  }

  async getAll() {
    return await avaliacaoRepo.getAllAvaliacoes();
  }

  async getById(id_avaliacao: number) {
    return await avaliacaoRepo.getAvaliacaoById(id_avaliacao);
  }

  async update(id_avaliacao: number, data: Partial<AvaliacaoAttributes>) {
    return await avaliacaoRepo.updateAvaliacao(id_avaliacao, data);
  }

  async delete(id_avaliacao: number) {
    return await avaliacaoRepo.deleteAvaliacao(id_avaliacao);
  }
}
