import { ProdutoRepository } from "../repository/ProdutoRepository";
import {
  ProdutoCreationAttributes,
  ProdutoAttributes,
} from "../models/ProdutoModel";

const produtoRepo = new ProdutoRepository();

export class ProdutoService {
  async create(data: ProdutoCreationAttributes) {
    return await produtoRepo.createProduto(data);
  }

  async getAll() {
    return await produtoRepo.getAllProdutos();
  }

  async getById(id_produto: number) {
    return await produtoRepo.getProdutoById(id_produto);
  }

  async update(id_produto: number, data: Partial<ProdutoAttributes>) {
    return await produtoRepo.updateProduto(id_produto, data);
  }

  async delete(id_produto: number) {
    return await produtoRepo.deleteProduto(id_produto);
  }
}
