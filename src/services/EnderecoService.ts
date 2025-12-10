import { EnderecoRepository } from "../repository/EnderecoRepository";
import {
  EnderecoCreationAttributes,
  EnderecoAttributes,
} from "../models/EnderecoModel";

const enderecoRepo = new EnderecoRepository();

export class EnderecoService {
  async create(data: EnderecoCreationAttributes) {
    return await enderecoRepo.createEndereco(data);
  }

  async getAll() {
    return await enderecoRepo.getAllEnderecos();
  }

  async getById(id_endereco: number) {
    return await enderecoRepo.getEnderecoById(id_endereco);
  }

  async update(id_endereco: number, data: Partial<EnderecoAttributes>) {
    return await enderecoRepo.updateEndereco(id_endereco, data);
  }

  async delete(id_endereco: number) {
    return await enderecoRepo.deleteEndereco(id_endereco);
  }
}
