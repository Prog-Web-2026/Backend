import { Endereco, EnderecoCreationAttributes } from "../models/EnderecoModel";

export class EnderecoRepository {
  async createEndereco(data: EnderecoCreationAttributes) {
    return await Endereco.create(data);
  }

  async getAllEnderecos() {
    return await Endereco.findAll();
  }

  async getEnderecoById(id_endereco: number) {
    return await Endereco.findByPk(id_endereco);
  }

  async updateEndereco(id_endereco: number, data: Partial<Endereco>) {
    const endereco = await Endereco.findByPk(id_endereco);
    if (!endereco) return null;
    return await endereco.update(data);
  }

  async deleteEndereco(id_endereco: number) {
    const endereco = await Endereco.findByPk(id_endereco);
    if (!endereco) return null;
    await endereco.destroy();
    return endereco;
  }
}
